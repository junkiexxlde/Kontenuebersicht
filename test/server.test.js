const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const https = require("node:https");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({ port: server.address().port, server });
    });
  });
}

function request(port, route, { method = "GET", body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body));
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path: route,
        method,
        rejectUnauthorized: false,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          ...(payload ? { "Content-Type": "application/json", "Content-Length": payload.length } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            reject(new Error(`Expected JSON from ${route}; received ${data}`));
            return;
          }
          resolve({
            status: res.statusCode,
            body: json,
            cookie: res.headers["set-cookie"]?.[0]?.split(";")[0],
          });
        });
      },
    );
    req.once("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function encryptLegacyVault(contents, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(contents), "utf8"),
    cipher.final(),
  ]);
  key.fill(0);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    salt: salt.toString("base64"),
  };
}

async function waitUntilReady(port, child) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Server exited before becoming ready.");
    try {
      const response = await request(port, "/api/session");
      if (response.status === 200) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }
  throw new Error("Server did not become ready.");
}

test("HTTPS multi-user registration, vault isolation, encrypted CRUD, and master-password change", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "kontenuebersicht-test-"));
  const initialPort = await freePort();
  await fs.writeFile(path.join(dataDir, "settings.json"), JSON.stringify({ port: initialPort }));

  const root = path.resolve(__dirname, "..");
  let child;
  let processOutput = "";
  async function startServer() {
    child = spawn("sh", ["docker/entrypoint.sh"], {
      cwd: root,
      env: { ...process.env, DATA_DIR: dataDir, HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
      processOutput += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
      processOutput += chunk;
    });
    child.on("exit", () => {
      if (child.exitCode !== 0) output += "\nServer process exited unexpectedly.";
    });
    try {
      await waitUntilReady(JSON.parse(await fs.readFile(path.join(dataDir, "settings.json"), "utf8")).port, child);
    } catch (error) {
      throw new Error(`${error.message}\n${processOutput}`);
    }
    return child;
  }
  async function stopServer() {
    if (!child || child.exitCode !== null) return;
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
  t.after(async () => {
    await stopServer();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  await startServer();
  assert.equal((await fs.stat(path.join(dataDir, "key.pem"))).mode & 0o777, 0o600);
  assert.equal((await fs.stat(dataDir)).mode & 0o777, 0o700);
  let port = initialPort;
  let response = await request(port, "/api/session");
  assert.equal(response.body.hasUsers, false);
  response = await request(port, "/api/banks");
  assert.equal(response.status, 200);
  assert.ok(response.body.banks.length >= 20);
  assert.ok(response.body.banks.some((bank) => bank.id === "ing-germany"));

  response = await request(port, "/api/register", {
    method: "POST",
    body: { email: "not-an-email", name: "Alice", password: "account password" },
  });
  assert.equal(response.status, 400);
  response = await request(port, "/api/register", {
    method: "POST",
    body: { email: "Alice@Example.test", name: "Alice", password: "alice account password" },
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.hasMasterPassword, false);
  let firstCookie = response.cookie;
  assert.ok(firstCookie);
  let status = await request(port, "/api/session", { cookie: firstCookie });
  assert.equal(status.body.authenticated, true);
  assert.equal(status.body.unlocked, false);
  const users = JSON.parse(await fs.readFile(path.join(dataDir, "users.json"), "utf8"));
  assert.equal(users.length, 1);
  const firstUser = users[0];
  assert.equal(firstUser.email, "alice@example.test");
  assert.equal(JSON.stringify(firstUser).includes("alice account password"), false);

  response = await request(port, "/api/master-password/setup", {
    method: "POST",
    cookie: firstCookie,
    body: { password: "short" },
  });
  assert.equal(response.status, 400);
  response = await request(port, "/api/master-password/setup", {
    method: "POST",
    cookie: firstCookie,
    body: { password: "correct horse battery" },
  });
  assert.equal(response.status, 201);

  const account = {
    accountName: "Daily account",
    holderName: "Alex Example",
    bankName: "Example Bank",
    iban: "DE89 3704 0044 0532 0130 00",
    bic: "COBADEFFXXX",
    onlineBankingUrl: "https://bank.example/login",
    username: "customer-123",
    password: "bank-secret-987",
    notes: "Private note",
  };
  response = await request(port, "/api/accounts", {
    method: "POST",
    cookie: firstCookie,
    body: { ...account, iban: "DE00 3704 0044 0532 0130 00" },
  });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /IBAN/);

  response = await request(port, "/api/accounts", {
    method: "POST",
    cookie: firstCookie,
    body: account,
  });
  assert.equal(response.status, 201);
  const accountId = response.body.account.id;
  response = await request(port, "/api/accounts", { cookie: firstCookie });
  assert.equal(response.body.accounts.length, 1);
  assert.equal(response.body.accounts[0].iban, "•••• •••• •••• 3000");

  const vaultFile = await fs.readFile(path.join(dataDir, "users", firstUser.id, "vault.json"), "utf8");
  assert.equal(vaultFile.includes("bank-secret-987"), false);
  assert.equal(vaultFile.includes("Daily account"), false);
  assert.equal(vaultFile.includes("alice account password"), false);

  response = await request(port, "/api/register", {
    method: "POST",
    body: { email: "ALICE@example.test", name: "Duplicate", password: "duplicate account password" },
  });
  assert.equal(response.status, 409);
  response = await request(port, "/api/register", {
    method: "POST",
    body: { email: "bob@example.test", name: "Bob", password: "bob account password" },
  });
  assert.equal(response.status, 201);
  let secondCookie = response.cookie;
  const secondUser = JSON.parse(await fs.readFile(path.join(dataDir, "users.json"), "utf8"))[1];
  response = await request(port, "/api/master-password/setup", {
    method: "POST",
    cookie: secondCookie,
    body: { password: "bob separate master password", bankIds: ["deutsche-bank", "commerzbank", "dkb", "n26", "ing-germany", "abn-amro"] },
  });
  assert.equal(response.status, 400);
  response = await request(port, "/api/master-password/setup", {
    method: "POST",
    cookie: secondCookie,
    body: { password: "bob separate master password", bankIds: ["ing-germany", "n26"] },
  });
  assert.equal(response.status, 201);
  response = await request(port, "/api/accounts", { cookie: secondCookie });
  assert.equal(response.body.accounts.length, 2);
  assert.deepEqual(response.body.accounts.map((entry) => entry.bankName).sort(), ["ING Deutschland", "N26"].sort());
  const ingAccount = response.body.accounts.find((entry) => entry.bankName === "ING Deutschland");
  response = await request(port, `/api/accounts/${ingAccount.id}`, { cookie: secondCookie });
  assert.equal(response.body.account.accountName, "ING Deutschland");
  assert.equal(response.body.account.bankName, "ING Deutschland");
  assert.equal(response.body.account.bic, "INGDDEFFXXX");
  assert.equal(response.body.account.iban, "");
  assert.equal(response.body.account.username, "");
  response = await request(port, `/api/accounts/${accountId}`, { cookie: secondCookie });
  assert.equal(response.status, 404);
  const secondVault = await fs.readFile(path.join(dataDir, "users", secondUser.id, "vault.json"), "utf8");
  assert.equal(secondVault.includes("Daily account"), false);
  response = await request(port, `/api/accounts/${accountId}`, { cookie: firstCookie });
  assert.equal(response.body.account.password, "bank-secret-987");
  response = await request(port, `/api/accounts/${accountId}`, {
    method: "PUT",
    cookie: firstCookie,
    body: { ...account, accountName: "Updated account" },
  });
  assert.equal(response.status, 200);
  response = await request(port, `/api/accounts/${accountId}`, { cookie: firstCookie });
  assert.equal(response.body.account.accountName, "Updated account");

  response = await request(port, "/api/login", {
    method: "POST",
    body: { email: "alice@example.test", password: "alice account password" },
  });
  assert.equal(response.status, 200);
  const extraCookie = response.cookie;
  response = await request(port, "/api/master-password/unlock", {
    method: "POST",
    cookie: extraCookie,
    body: { password: "correct horse battery" },
  });
  assert.equal(response.status, 200);

  response = await request(port, "/api/master-password", {
    method: "POST",
    cookie: firstCookie,
    body: {
      currentPassword: "incorrect current password",
      newPassword: "an entirely new passphrase",
    },
  });
  assert.equal(response.status, 401);
  response = await request(port, "/api/master-password", {
    method: "POST",
    cookie: firstCookie,
    body: {
      currentPassword: "correct horse battery",
      newPassword: "an entirely new passphrase",
    },
  });
  assert.equal(response.status, 200);
  response = await request(port, "/api/accounts", { cookie: extraCookie });
  assert.equal(response.status, 401);

  const occupied = await reservePort();
  response = await request(port, "/api/settings", {
    method: "POST",
    cookie: firstCookie,
    body: { port: occupied.port },
  });
  assert.equal(response.status, 409);
  occupied.server.close();
  response = await request(port, "/api/session", { cookie: firstCookie });
  assert.equal(response.body.port, port);

  const newPort = await freePort();
  response = await request(port, "/api/settings", {
    method: "POST",
    cookie: firstCookie,
    body: { port: newPort },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.changed, true);
  port = newPort;
  await waitUntilReady(port, child);

  response = await request(port, "/api/lock", { method: "POST", cookie: firstCookie });
  assert.equal(response.status, 200);
  response = await request(port, "/api/accounts", { cookie: firstCookie });
  assert.equal(response.status, 401);
  response = await request(port, "/api/login", {
    method: "POST",
    body: { email: "alice@example.test", password: "alice account password" },
  });
  assert.equal(response.status, 200);
  firstCookie = response.cookie;
  response = await request(port, "/api/master-password/unlock", {
    method: "POST",
    cookie: firstCookie,
    body: { password: "correct horse battery" },
  });
  assert.equal(response.status, 401);
  response = await request(port, "/api/master-password/unlock", {
    method: "POST",
    cookie: firstCookie,
    body: { password: "an entirely new passphrase" },
  });
  assert.equal(response.status, 200);
  response = await request(port, `/api/accounts/${accountId}`, { cookie: firstCookie });
  assert.equal(response.body.account.password, "bank-secret-987");

  await stopServer();
  await startServer();
  response = await request(port, "/api/session");
  assert.equal(response.body.hasUsers, true);
  assert.equal(response.body.authenticated, false);
  assert.equal(response.body.unlocked, false);
  assert.equal(response.body.port, port);
  response = await request(port, "/api/login", {
    method: "POST",
    body: { email: "alice@example.test", password: "alice account password" },
  });
  assert.equal(response.status, 200);
  firstCookie = response.cookie;
  response = await request(port, "/api/master-password/unlock", {
    method: "POST",
    cookie: firstCookie,
    body: { password: "an entirely new passphrase" },
  });
  assert.equal(response.status, 200);
  firstCookie = response.cookie;
  response = await request(port, `/api/accounts/${accountId}`, { cookie: firstCookie });
  assert.equal(response.body.account.accountName, "Updated account");
  response = await request(port, `/api/accounts/${accountId}`, { method: "DELETE", cookie: firstCookie });
  assert.equal(response.status, 200);
  response = await request(port, "/api/accounts", { cookie: firstCookie });
  assert.equal(response.body.accounts.length, 0);
});

test("first registered user inherits the existing encrypted vault", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "kontenuebersicht-migration-test-"));
  const initialPort = await freePort();
  await fs.writeFile(path.join(dataDir, "settings.json"), JSON.stringify({ port: initialPort }));
  await fs.writeFile(path.join(dataDir, "vault.json"), JSON.stringify(encryptLegacyVault({
    accounts: [{
      id: "123e4567-e89b-42d3-a456-426614174000",
      accountName: "Existing account",
      holderName: "Alex Example",
      bankName: "Example Bank",
      iban: "DE89370400440532013000",
      bic: "COBADEFFXXX",
      onlineBankingUrl: "https://bank.example/login",
      username: "existing-customer",
      password: "legacy-bank-password",
      notes: "Must be preserved",
    }],
  }, "legacy master password")));

  const root = path.resolve(__dirname, "..");
  const child = spawn("sh", ["docker/entrypoint.sh"], {
    cwd: root,
    env: { ...process.env, DATA_DIR: dataDir, HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  async function stopServer() {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
  t.after(async () => {
    await stopServer();
    await fs.rm(dataDir, { recursive: true, force: true });
  });
  await waitUntilReady(initialPort, child).catch((error) => {
    throw new Error(`${error.message}\n${output}`);
  });

  let response = await request(initialPort, "/api/register", {
    method: "POST",
    body: { email: "legacy@example.test", name: "Legacy Owner", password: "account password" },
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.hasMasterPassword, true);
  const cookie = response.cookie;
  response = await request(initialPort, "/api/master-password/setup", {
    method: "POST",
    cookie,
    body: { password: "new master password phrase" },
  });
  assert.equal(response.status, 409);
  response = await request(initialPort, "/api/master-password/unlock", {
    method: "POST",
    cookie,
    body: { password: "legacy master password" },
  });
  assert.equal(response.status, 200);
  response = await request(initialPort, "/api/accounts/123e4567-e89b-42d3-a456-426614174000", { cookie });
  assert.equal(response.status, 200);
  assert.equal(response.body.account.password, "legacy-bank-password");
  assert.equal(response.body.account.notes, "Must be preserved");
  const users = JSON.parse(await fs.readFile(path.join(dataDir, "users.json"), "utf8"));
  await fs.access(path.join(dataDir, "users", users[0].id, "vault.json"));
  await assert.rejects(fs.access(path.join(dataDir, "vault.json")), { code: "ENOENT" });
});
