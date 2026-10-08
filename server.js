const fs = require("node:fs/promises");
const path = require("node:path");
const https = require("node:https");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { promisify } = require("node:util");

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const HOST = process.env.HOST || "127.0.0.1";
const VAULT_PATH = path.join(DATA_DIR, "vault.json");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const USER_DATA_DIR = path.join(DATA_DIR, "users");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const CERT_PATH = path.join(DATA_DIR, "cert.pem");
const KEY_PATH = path.join(DATA_DIR, "key.pem");
const SESSION_MAX_AGE_MS = 15 * 60 * 1000;
const MAX_BODY_BYTES = 1024 * 1024;
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();
const loginFailures = new Map();
const userWriteLocks = new Map();
let registrationInProgress = false;
let activeServer;
let currentPort;

async function deriveKey(password, salt) {
  return scrypt(password, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

function encryptVault(contents, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(contents), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decryptVault(encrypted, key) {
  if (
    encrypted?.version !== 1 ||
    !encrypted.iv ||
    !encrypted.tag ||
    !encrypted.ciphertext
  ) {
    throw new Error("The encrypted vault is invalid.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const first = decipher.update(Buffer.from(encrypted.ciphertext, "base64"));
  let final;
  try {
    final = decipher.final();
  } catch {
    throw Object.assign(new Error("Vault authentication failed."), {
      code: "VAULT_AUTH_FAILED",
    });
  }
  const plaintext = Buffer.concat([
    first,
    final,
  ]).toString("utf8");
  const contents = JSON.parse(plaintext);
  if (!contents || !Array.isArray(contents.accounts)) {
    throw new Error("The vault contents are invalid.");
  }
  return contents;
}

async function atomicWrite(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  const file = await fs.open(temporaryPath, "wx", 0o600);
  try {
    await file.writeFile(`${JSON.stringify(contents, null, 2)}\n`, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  await fs.rename(temporaryPath, filePath);
}

async function readSettings() {
  try {
    const settings = JSON.parse(await fs.readFile(SETTINGS_PATH, "utf8"));
    if (!Number.isInteger(settings.port) || settings.port < 1024 || settings.port > 65535) {
      throw new Error("The saved server port is invalid.");
    }
    return settings;
  } catch (error) {
    if (error.code === "ENOENT") return { port: 4005 };
    throw error;
  }
}

async function readUsers() {
  try {
    const users = JSON.parse(await fs.readFile(USERS_PATH, "utf8"));
    if (!Array.isArray(users)) throw new Error("The user database is invalid.");
    return users;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function userVaultPath(userId) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("The user id is invalid.");
  return path.join(USER_DATA_DIR, userId, "vault.json");
}

async function readUserVaultFile(userId) {
  return JSON.parse(await fs.readFile(userVaultPath(userId), "utf8"));
}

async function saveUserVault(userId, contents, key, salt) {
  if (!key || !salt) throw new Error("The vault is locked.");
  await atomicWrite(userVaultPath(userId), {
    ...encryptVault(contents, key),
    salt: salt.toString("base64"),
  });
}

async function withUserWriteLock(userId, action) {
  const previous = userWriteLocks.get(userId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  userWriteLocks.set(userId, current);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (userWriteLocks.get(userId) === current) userWriteLocks.delete(userId);
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((entry) => {
      const separator = entry.indexOf("=");
      if (separator < 0) return ["", ""];
      let value = entry.slice(separator + 1).trim();
      try {
        value = decodeURIComponent(value);
      } catch {
        return ["", ""];
      }
      return [
        entry.slice(0, separator).trim(),
        value,
      ];
    }),
  );
}

function clearSession(session) {
  session.masterKey?.fill(0);
  session.masterKey = undefined;
  session.vaultSalt?.fill(0);
  session.vaultSalt = undefined;
}

function pruneSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.lastSeen > SESSION_MAX_AGE_MS) {
      clearSession(session);
      sessions.delete(token);
    }
  }
  for (const [key, failure] of loginFailures) {
    if (now - failure.lastAttempt > 10 * 60 * 1000) loginFailures.delete(key);
  }
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).vault_session;
  const session = token && sessions.get(token);
  if (!session || Date.now() - session.lastSeen > SESSION_MAX_AGE_MS) {
    if (token && session) clearSession(session);
    if (token) sessions.delete(token);
    pruneSessions();
    return null;
  }
  session.lastSeen = Date.now();
  return { token, session };
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `vault_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "vault_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  );
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let oversized = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES && !oversized) {
        oversized = true;
        reject(Object.assign(new Error("Request body is too large."), { status: 413 }));
      }
      if (!oversized) chunks.push(chunk);
    });
    req.on("end", () => {
      if (oversized) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function validatePassword(password, label = "Master password") {
  if (typeof password !== "string" || Array.from(password).length < 12) {
    throw Object.assign(
      new Error(`${label} must be at least 12 characters long.`),
      { status: 400 },
    );
  }
}

function validateUserCredentials(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Enter your account details."), { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw Object.assign(new Error("Enter a valid email address."), { status: 400 });
  }
  if (!name || name.length > 80) {
    throw Object.assign(new Error("Name must be between 1 and 80 characters."), { status: 400 });
  }
  if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128) {
    throw Object.assign(new Error("Account password must be between 8 and 128 characters."), { status: 400 });
  }
  return { email, name, password: body.password };
}

async function userVaultExists(userId) {
  try {
    await fs.access(userVaultPath(userId));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readSessionVault(session) {
  if (!session.masterKey) throw Object.assign(new Error("Unlock the vault to continue."), { status: 401 });
  const encrypted = await readUserVaultFile(session.userId);
  if (!session.masterKey) throw Object.assign(new Error("Unlock the vault to continue."), { status: 401 });
  try {
    return decryptVault(encrypted, session.masterKey);
  } catch (error) {
    if (error.code === "VAULT_AUTH_FAILED") {
      clearSession(session);
      throw Object.assign(new Error("Your master password changed. Unlock your vault again."), { status: 401 });
    }
    throw error;
  }
}

function newSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, { userId, lastSeen: Date.now() });
  return token;
}

async function authenticateAccount(email, password) {
  const users = await readUsers();
  const user = users.find((entry) => entry.email === email);
  const salt = user ? Buffer.from(user.passwordSalt, "base64") : Buffer.alloc(16);
  const candidate = await deriveKey(password, salt);
  const expected = user ? Buffer.from(user.passwordHash, "base64") : Buffer.alloc(32);
  const authenticated = Boolean(user) && expected.length === candidate.length
    && crypto.timingSafeEqual(candidate, expected);
  candidate.fill(0);
  if (!authenticated) return null;
  return user;
}

async function createUser(body) {
  const { email, name, password } = validateUserCredentials(body);
  const users = await readUsers();
  if (users.some((user) => user.email === email)) {
    throw Object.assign(new Error("An account with this email address already exists."), { status: 409 });
  }

  const id = crypto.randomUUID();
  const passwordSalt = crypto.randomBytes(16);
  const passwordHash = await deriveKey(password, passwordSalt);
  const user = {
    id,
    email,
    name,
    passwordSalt: passwordSalt.toString("base64"),
    passwordHash: passwordHash.toString("base64"),
    createdAt: new Date().toISOString(),
  };
  if (users.length === 0) {
    try {
      const legacy = JSON.parse(await fs.readFile(VAULT_PATH, "utf8"));
      if (!legacy.salt) throw new Error("The existing encrypted vault is invalid.");
      await atomicWrite(userVaultPath(id), legacy);
    } catch (error) {
      if (error.code !== "ENOENT") {
        passwordHash.fill(0);
        throw error;
      }
    }
  }
  try {
    await atomicWrite(USERS_PATH, [...users, user]);
  } catch (error) {
    passwordHash.fill(0);
    throw error;
  }
  passwordHash.fill(0);
  if (users.length === 0) {
    try {
      await fs.unlink(VAULT_PATH);
    } catch (error) {
      if (error.code !== "ENOENT") console.error("Unable to remove migrated legacy vault:", error.message);
    }
  }
  return user;
}

async function normalizeAccount(input, existing) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw Object.assign(new Error("Account details are required."), { status: 400 });
  }
  const fields = [
    "accountName",
    "holderName",
    "bankName",
    "iban",
    "bic",
    "onlineBankingUrl",
    "username",
    "password",
    "notes",
  ];
  const account = {};
  const maximumLengths = {
    accountName: 100,
    holderName: 120,
    bankName: 120,
    iban: 34,
    bic: 11,
    onlineBankingUrl: 500,
    username: 200,
    password: 1000,
    notes: 4000,
  };
  for (const field of fields) {
    const value = input[field] ?? (existing ? existing[field] : "");
    if (typeof value !== "string" || value.length > maximumLengths[field]) {
      throw Object.assign(new Error(`Invalid ${field} value.`), { status: 400 });
    }
    account[field] = value.trim();
  }
  account.iban = account.iban.replace(/\s+/g, "").toUpperCase();
  account.bic = account.bic.replace(/\s+/g, "").toUpperCase();
  if (!account.accountName || !account.bankName) {
    throw Object.assign(
      new Error("Account name and bank name are required."),
      { status: 400 },
    );
  }
  if (account.onlineBankingUrl) {
    let url;
    try {
      url = new URL(account.onlineBankingUrl);
    } catch {
      throw Object.assign(new Error("Enter a valid online banking URL."), { status: 400 });
    }
    if (url.protocol !== "https:") {
      throw Object.assign(new Error("Online banking URLs must use HTTPS."), { status: 400 });
    }
  }
  if (account.iban && !(await validateIban(account.iban))) {
    throw Object.assign(
      new Error("The IBAN is invalid. Check its format and checksum."),
      { status: 400 },
    );
  }
  return account;
}

function validateIban(iban) {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", [path.join(ROOT, "tools", "validate_iban.py")], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let errorOutput = "";
    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    process.stdout.on("data", (chunk) => {
      output += chunk;
    });
    process.stderr.on("data", (chunk) => {
      errorOutput += chunk;
    });
    process.on("error", (error) => reject(new Error(`IBAN validation could not run: ${error.message}`)));
    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`IBAN validation failed: ${errorOutput || "validator exited unexpectedly"}`));
        return;
      }
      try {
        resolve(JSON.parse(output).valid === true);
      } catch {
        reject(new Error("IBAN validation returned an invalid response."));
      }
    });
    process.stdin.end(JSON.stringify({ iban }));
  });
}

function accountSummary(account) {
  const suffix = account.iban.slice(-4);
  return {
    id: account.id,
    accountName: account.accountName,
    bankName: account.bankName,
    iban: suffix ? `•••• •••• •••• ${suffix}` : "",
  };
}

function createHttpsServer() {
  const options = {
    key: require("node:fs").readFileSync(KEY_PATH),
    cert: require("node:fs").readFileSync(CERT_PATH),
    minVersion: "TLSv1.2",
  };
  const server = https.createServer(options, (req, res) => {
    for (const [name, value] of Object.entries({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    })) {
      res.setHeader(name, value);
    }
    void handleRequest(req, res).catch((error) => {
      if (res.headersSent || res.destroyed) return;
      const status = Number.isInteger(error.status) ? error.status : 500;
      if (status === 500) console.error("Request failed:", error.message);
      sendJson(res, status, {
        error: status === 500 ? "The request could not be completed." : error.message,
      });
    });
  });
  server.on("error", (error) => {
    console.error("HTTPS server error:", error.message);
  });
  return server;
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, "https://localhost");
  if (url.pathname.startsWith("/api/")) {
    if (req.method !== "GET" && req.headers["x-requested-with"] !== "XMLHttpRequest") {
      sendJson(res, 403, { error: "A same-origin request header is required." });
      return;
    }
    const route = `${req.method} ${url.pathname}`;

    if (route === "GET /api/session") {
      pruneSessions();
      const active = getSession(req);
      const users = await readUsers();
      const user = active && users.find((entry) => entry.id === active.session.userId);
      if (active) setSessionCookie(res, active.token);
      sendJson(res, 200, {
        hasUsers: users.length > 0,
        authenticated: Boolean(user),
        hasMasterPassword: user ? await userVaultExists(user.id) : false,
        unlocked: Boolean(active?.session.masterKey),
        user: user ? { name: user.name, email: user.email } : null,
        port: currentPort,
      });
      return;
    }
    if (route === "POST /api/register") {
      if (registrationInProgress) {
        sendJson(res, 409, { error: "Registration is already in progress. Try again shortly." });
        return;
      }
      registrationInProgress = true;
      try {
        const body = await readBody(req);
        const user = await createUser(body);
        const token = newSession(user.id);
        setSessionCookie(res, token);
        sendJson(res, 201, { ok: true, hasMasterPassword: await userVaultExists(user.id) });
      } finally {
        registrationInProgress = false;
      }
      return;
    }
    if (route === "POST /api/login") {
      const body = await readBody(req);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email || typeof body.password !== "string") {
        sendJson(res, 400, { error: "Enter your email address and account password." });
        return;
      }
      const failureKey = `account:${email}`;
      const failure = loginFailures.get(failureKey);
      if (failure && failure.blockedUntil > Date.now()) {
        sendJson(res, 429, { error: "Too many attempts. Wait 30 seconds and try again." });
        return;
      }
      const user = await authenticateAccount(email, body.password);
      if (!user) {
        const attempts = (failure?.attempts || 0) + 1;
        loginFailures.set(failureKey, {
          attempts: attempts % 5,
          blockedUntil: attempts % 5 === 0 ? Date.now() + 30_000 : 0,
          lastAttempt: Date.now(),
        });
        sendJson(res, 401, { error: "The email address or account password is incorrect." });
        return;
      }
      loginFailures.delete(failureKey);
      const token = newSession(user.id);
      setSessionCookie(res, token);
      sendJson(res, 200, { ok: true, hasMasterPassword: await userVaultExists(user.id) });
      return;
    }

    const active = getSession(req);
    if (route === "POST /api/lock") {
      if (active) {
        clearSession(active.session);
        sessions.delete(active.token);
      }
      clearSessionCookie(res);
      sendJson(res, 200, { ok: true });
      return;
    }
    if (route === "POST /api/master-password/setup") {
      if (!active) {
        sendJson(res, 401, { error: "Sign in to your account first." });
        return;
      }
      const created = await withUserWriteLock(active.session.userId, async () => {
        if (await userVaultExists(active.session.userId)) return false;
        const body = await readBody(req);
        validatePassword(body.password);
        const salt = crypto.randomBytes(16);
        const key = await deriveKey(body.password, salt);
        try {
          await saveUserVault(active.session.userId, { accounts: [] }, key, salt);
        } catch (error) {
          key.fill(0);
          throw error;
        }
        active.session.masterKey = key;
        active.session.vaultSalt = salt;
        return true;
      });
      if (!created) {
        sendJson(res, 409, { error: "Your vault has already been set up. Unlock it to continue." });
        return;
      }
      setSessionCookie(res, active.token);
      sendJson(res, 201, { ok: true });
      return;
    }
    if (route === "POST /api/master-password/unlock") {
      if (!active) {
        sendJson(res, 401, { error: "Sign in to your account first." });
        return;
      }
      if (!(await userVaultExists(active.session.userId))) {
        sendJson(res, 409, { error: "Set up your master password before unlocking the vault." });
        return;
      }
      const failureKey = `master:${active.session.userId}`;
      const failure = loginFailures.get(failureKey);
      if (failure && failure.blockedUntil > Date.now()) {
        sendJson(res, 429, { error: "Too many attempts. Wait 30 seconds and try again." });
        return;
      }
      const body = await readBody(req);
      if (typeof body.password !== "string") {
        sendJson(res, 400, { error: "Enter your master password." });
        return;
      }
      let candidateKey;
      try {
        const encrypted = await readUserVaultFile(active.session.userId);
        const salt = Buffer.from(encrypted.salt, "base64");
        candidateKey = await deriveKey(body.password, salt);
        decryptVault(encrypted, candidateKey);
        clearSession(active.session);
        active.session.masterKey = candidateKey;
        active.session.vaultSalt = salt;
        candidateKey = undefined;
        loginFailures.delete(failureKey);
        setSessionCookie(res, active.token);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        candidateKey?.fill(0);
        if (error.code !== "VAULT_AUTH_FAILED") throw error;
        const attempts = (failure?.attempts || 0) + 1;
        loginFailures.set(failureKey, {
          attempts: attempts % 5,
          blockedUntil: attempts % 5 === 0 ? Date.now() + 30_000 : 0,
          lastAttempt: Date.now(),
        });
        sendJson(res, 401, { error: "The master password is incorrect." });
      }
      return;
    }
    if (!active) {
      sendJson(res, 401, { error: "Sign in to your account first." });
      return;
    }
    const session = active.session;
    if (!session.masterKey) {
      sendJson(res, 401, { error: "Unlock the vault to continue." });
      return;
    }
    setSessionCookie(res, active.token);

    if (route === "GET /api/accounts") {
      const vault = await readSessionVault(session);
      sendJson(res, 200, { accounts: vault.accounts.map(accountSummary) });
      return;
    }
    if (route === "POST /api/accounts") {
      const body = await readBody(req);
      const account = await withUserWriteLock(session.userId, async () => {
        const vault = await readSessionVault(session);
        const nextAccount = {
          ...(await normalizeAccount(body)),
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserVault(session.userId, { ...vault, accounts: [...vault.accounts, nextAccount] }, session.masterKey, session.vaultSalt);
        return nextAccount;
      });
      sendJson(res, 201, { account: accountSummary(account) });
      return;
    }
    if (route === "POST /api/settings") {
      const body = await readBody(req);
      const port = Number(body.port);
      if (!Number.isInteger(port) || port < 1024 || port > 65535) {
        sendJson(res, 400, { error: "Choose a port from 1024 to 65535." });
        return;
      }
      if (port === currentPort) {
        sendJson(res, 200, { port, changed: false });
        return;
      }
      const nextServer = createHttpsServer();
      try {
        await listen(nextServer, port);
      } catch (error) {
        if (nextServer.listening) nextServer.close();
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          sendJson(res, 409, { error: `Port ${port} is unavailable.` });
          return;
        }
        throw error;
      }
      try {
        await atomicWrite(SETTINGS_PATH, { port });
      } catch (error) {
        nextServer.close();
        throw error;
      }
      const previousServer = activeServer;
      activeServer = nextServer;
      currentPort = port;
      sendJson(res, 200, { port, changed: true });
      res.once("finish", () => previousServer.close());
      return;
    }
    if (route === "POST /api/master-password") {
      const body = await readBody(req);
      if (typeof body.currentPassword !== "string") {
        sendJson(res, 400, { error: "Enter your current master password." });
        return;
      }
      validatePassword(body.newPassword);
      const changed = await withUserWriteLock(session.userId, async () => {
        const encrypted = await readUserVaultFile(session.userId);
        const oldKey = await deriveKey(body.currentPassword, Buffer.from(encrypted.salt, "base64"));
        let verifiedVault;
        try {
          verifiedVault = decryptVault(encrypted, oldKey);
        } catch (error) {
          oldKey.fill(0);
          if (error.code === "VAULT_AUTH_FAILED") return null;
          throw error;
        }
        oldKey.fill(0);
        const salt = crypto.randomBytes(16);
        const newKey = await deriveKey(body.newPassword, salt);
        try {
          await saveUserVault(session.userId, verifiedVault, newKey, salt);
        } catch (error) {
          newKey.fill(0);
          throw error;
        }
        return { key: newKey, salt };
      });
      if (!changed) {
        sendJson(res, 401, { error: "The current master password is incorrect." });
        return;
      }
      clearSession(session);
      session.masterKey = changed.key;
      session.vaultSalt = changed.salt;
      for (const [token, otherSession] of sessions) {
        if (token !== active.token && otherSession.userId === session.userId) {
          clearSession(otherSession);
          sessions.delete(token);
        }
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    const accountMatch = url.pathname.match(/^\/api\/accounts\/([0-9a-f-]+)$/i);
    if (accountMatch && req.method === "GET") {
      const vault = await readSessionVault(session);
      const account = vault.accounts.find((entry) => entry.id === accountMatch[1]);
      if (!account) {
        sendJson(res, 404, { error: "Account not found." });
        return;
      }
      sendJson(res, 200, { account });
      return;
    }
    if (accountMatch && req.method === "PUT") {
      const body = await readBody(req);
      const updated = await withUserWriteLock(session.userId, async () => {
        const vault = await readSessionVault(session);
        const index = vault.accounts.findIndex((entry) => entry.id === accountMatch[1]);
        if (index < 0) return null;
        const existing = vault.accounts[index];
        const nextAccount = {
          ...existing,
          ...(await normalizeAccount(body, existing)),
          updatedAt: new Date().toISOString(),
        };
        const accounts = [...vault.accounts];
        accounts[index] = nextAccount;
        await saveUserVault(session.userId, { ...vault, accounts }, session.masterKey, session.vaultSalt);
        return nextAccount;
      });
      if (!updated) {
        sendJson(res, 404, { error: "Account not found." });
        return;
      }
      sendJson(res, 200, { account: accountSummary(updated) });
      return;
    }
    if (accountMatch && req.method === "DELETE") {
      const deleted = await withUserWriteLock(session.userId, async () => {
        const vault = await readSessionVault(session);
        const accounts = vault.accounts.filter((entry) => entry.id !== accountMatch[1]);
        if (accounts.length === vault.accounts.length) return false;
        await saveUserVault(session.userId, { ...vault, accounts }, session.masterKey, session.vaultSalt);
        return true;
      });
      if (!deleted) {
        sendJson(res, 404, { error: "Account not found." });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }
    sendJson(res, 404, { error: "API route not found." });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const assetPath = path.resolve(ROOT, "public", `.${decodeURIComponent(requestPath)}`);
  if (!assetPath.startsWith(path.resolve(ROOT, "public") + path.sep)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  try {
    const contents = await fs.readFile(assetPath);
    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(assetPath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") res.end();
    else res.end(contents);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
    res.writeHead(404);
    res.end("Not found");
  }
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(DATA_DIR, 0o700);
  const settings = await readSettings();
  currentPort = settings.port;
  activeServer = createHttpsServer();
  await listen(activeServer, currentPort);
  console.log(`Kontenübersicht is ready at https://localhost:${currentPort}`);
}

setInterval(pruneSessions, 60_000).unref();
main().catch((error) => {
  console.error("Unable to start the HTTPS server:", error.message);
  process.exitCode = 1;
});
