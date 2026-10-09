# Kontenübersicht

Kontenübersicht is a multi-user HTTPS vault for European bank account details. Users register with an email address, a display name, and an account password, then create a separate master password that encrypts their own bank-account vault. Each user's encrypted vault is stored separately.

## Run with Docker Compose

Requirements: Docker Engine and Docker Compose on Linux.

```sh
docker compose up --build -d
```

Open **https://localhost:4005** and register a user. The email address is checked for valid syntax and uniqueness; it is not verified by email. Account passwords must be at least 8 characters. Each user separately creates a master password of at least 12 characters; the master password cannot be recovered if lost.

During a new user's first master-password setup, they can select up to five banks from the starter list. Each selection creates an encrypted account entry with the bank name as both account name and bank, plus its listed BIC/SWIFT. Other account details can be filled in later. Bank icons are loaded directly from each bank's website and may be unavailable.

If a legacy single-user `vault.json` exists, it is migrated to the first registered user's separate vault. That user unlocks it with the existing master password. Other new users start with an empty vault and create their own master password.

The server binds to `127.0.0.1`. Its account registry, per-user encrypted vaults, settings, and TLS files live in the `kontenuebersicht-data` Docker volume. Do not run `docker compose down -v` unless you intend to delete that data.

## Webserver deployment

The Compose setup uses host networking and is intended for Docker Engine on Linux. The application listens on localhost with a locally generated, self-signed HTTPS certificate. To serve it as a website:

- Put it behind a maintained reverse proxy that serves a trusted HTTPS certificate and forwards requests only to the local application.
- Keep the app's port inaccessible from the public network. Do not expose its self-signed HTTPS listener directly to the internet.
- Preserve the `kontenuebersicht-data` volume across container upgrades and back it up regularly.
- If migrating an existing vault, make the owner's first registration yourself before making the site public; that first account inherits the existing vault.
- Open registration is enabled. There is no email ownership verification or account-password reset flow; users who forget the master password cannot recover their vault.
- Review operational security, backups, monitoring, and abuse controls before accepting real financial data or public users.

The existing Options → HTTPS server port setting changes the app's local listening port. Update the reverse proxy's upstream at the same time if you change it.

## Run with Node.js

Requirements: Node.js 20 or newer, Python 3, and OpenSSL.

```sh
npm start
```

The startup script creates a self-signed certificate in `./data` when one is not already present. Open **https://localhost:4005**.

## Security and backups

- User account passwords are stored as salted scrypt hashes and are separate from master passwords.
- Each user's account data is encrypted at rest with AES-256-GCM using a key derived from that user's master password with scrypt.
- The app decrypts a user's data in server memory while their vault is unlocked. This is not end-to-end encryption against the webserver operator.
- Sessions expire after 15 minutes of inactivity. Use **Log out** to end the session and lock the vault.
- Back up the Docker volume (or `./data` for a direct Node.js run) while the app is stopped. Vault files are encrypted; still treat the user registry, TLS private key, and backups as sensitive.
- Language and appearance defaults are stored in the browser, not in the encrypted vault.

## Tests

```sh
npm test
```
