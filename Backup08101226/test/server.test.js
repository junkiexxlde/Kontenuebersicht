const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const https = require("node:https");
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

test("HTTPS vault setup, encrypted CRUD, password change, and live port change", async (t) => {
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
  assert.equal(response.body.initialized, false);

  response = await request(port, "/api/setup", {
    method: "POST",
    body: { password: "short" },
  });
  assert.equal(response.status, 400);

  response = await request(port, "/api/setup", {
    method: "POST",
    body: { password: "correct horse battery", confirmPassword: "correct horse battery" },
  });
  assert.equal(response.status, 201);
  let cookie = response.cookie;
  assert.ok(cookie);

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
    cookie,
    body: { ...account, iban: "DE00 3704 0044 0532 0130 00" },
  });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /IBAN/);

  response = await request(port, "/api/accounts", {
    method: "POST",
    cookie,
    body: account,
  });
  assert.equal(response.status, 201);
  const accountId = response.body.account.id;
  response = await request(port, "/api/accounts", { cookie });
  assert.equal(response.body.accounts.length, 1);
  assert.equal(response.body.accounts[0].iban, "•••• •••• •••• 3000");

  const vaultFile = await fs.readFile(path.join(dataDir, "vault.json"), "utf8");
  assert.equal(vaultFile.includes("bank-secret-987"), false);
  assert.equal(vaultFile.includes("Daily account"), false);
  assert.equal(vaultFile.includes("correct horse battery"), false);

  response = await request(port, `/api/accounts/${accountId}`, { cookie });
  assert.equal(response.body.account.password, "bank-secret-987");
  response = await request(port, `/api/accounts/${accountId}`, {
    method: "PUT",
    cookie,
    body: { ...account, accountName: "Updated account" },
  });
  assert.equal(response.status, 200);
  response = await request(port, `/api/accounts/${accountId}`, { cookie });
  assert.equal(response.body.account.accountName, "Updated account");

  response = await request(port, "/api/master-password", {
    method: "POST",
    cookie,
    body: {
      currentPassword: "incorrect current password",
      newPassword: "an entirely new passphrase",
    },
  });
  assert.equal(response.status, 401);
  response = await request(port, "/api/master-password", {
    method: "POST",
    cookie,
    body: {
      currentPassword: "correct horse battery",
      newPassword: "an entirely new passphrase",
    },
  });
  assert.equal(response.status, 200);

  const occupied = await reservePort();
  response = await request(port, "/api/settings", {
    method: "POST",
    cookie,
    body: { port: occupied.port },
  });
  assert.equal(response.status, 409);
  occupied.server.close();
  response = await request(port, "/api/session", { cookie });
  assert.equal(response.body.port, port);

  const newPort = await freePort();
  response = await request(port, "/api/settings", {
    method: "POST",
    cookie,
    body: { port: newPort },
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.changed, true);
  port = newPort;
  await waitUntilReady(port, child);

  response = await request(port, "/api/lock", { method: "POST", cookie });
  assert.equal(response.status, 200);
  response = await request(port, "/api/accounts", { cookie });
  assert.equal(response.status, 401);
  response = await request(port, "/api/unlock", {
    method: "POST",
    body: { password: "correct horse battery" },
  });
  assert.equal(response.status, 401);
  response = await request(port, "/api/unlock", {
    method: "POST",
    body: { password: "an entirely new passphrase" },
  });
  assert.equal(response.status, 200);
  cookie = response.cookie;
  response = await request(port, `/api/accounts/${accountId}`, { cookie });
  assert.equal(response.body.account.password, "bank-secret-987");

  await stopServer();
  await startServer();
  response = await request(port, "/api/session");
  assert.equal(response.body.initialized, true);
  assert.equal(response.body.unlocked, false);
  assert.equal(response.body.port, port);
  response = await request(port, "/api/unlock", {
    method: "POST",
    body: { password: "an entirely new passphrase" },
  });
  assert.equal(response.status, 200);
  cookie = response.cookie;
  response = await request(port, `/api/accounts/${accountId}`, { cookie });
  assert.equal(response.body.account.accountName, "Updated account");
  response = await request(port, `/api/accounts/${accountId}`, { method: "DELETE", cookie });
  assert.equal(response.status, 200);
  response = await request(port, "/api/accounts", { cookie });
  assert.equal(response.body.accounts.length, 0);
});
