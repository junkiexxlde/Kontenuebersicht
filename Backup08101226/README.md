# Kontenübersicht

A local, single-user HTTPS vault for European bank account details. The Node.js app serves a JavaScript/HTML/CSS interface, uses Python for IBAN checksum validation, and encrypts the entire account database before it is written to disk.

## Run with Docker Compose

Requirements: Docker Engine and Docker Compose on Linux.

```sh
docker compose up --build -d
```

Open **https://localhost:4005** and create a unique master password of at least 12 characters. The first launch creates a self-signed TLS certificate and stores it with the encrypted vault in the `kontenuebersicht-data` Docker volume. Your browser will show a certificate warning until you explicitly trust a certificate issued for your device.

Choose the default language and appearance in the separate **Options → Language** and **Options → Appearance** cards. These defaults are saved in this browser and applied on the next page load or visit. The language and theme toggles on the sign-in page and in the top bar change only the current visit; they do not change the saved defaults.

Compose uses host networking so a port saved in **Options → HTTPS server** can take effect immediately. The app binds only to `127.0.0.1`; it is not exposed to your local network. Host networking is supported by Docker Engine on Linux. Do not expose this service directly to the internet.

## Run with Node.js

Requirements: Node.js 20 or newer, Python 3, and OpenSSL.

```sh
npm start
```

The startup script creates a self-signed certificate in `./data` when one is not already present. Open **https://localhost:4005**.

## Security and backups

- Account information is encrypted at rest with AES-256-GCM. A key is derived from the master password using scrypt; the password itself is not stored.
- The vault locks after 15 minutes of inactivity. Use **Lock vault** to lock it sooner.
- Use a strong, unique master password and keep it somewhere safe. There is no password recovery.
- Back up the Docker volume (or `./data` for a direct Node.js run) while the app is stopped. The vault file remains encrypted, but the TLS private key and other volume contents should still be treated as sensitive.
- The included self-signed certificate is for local use. For any deployment beyond localhost, configure a trusted TLS certificate, network access controls, and an appropriate deployment review first.

## Tests

```sh
npm test
```
