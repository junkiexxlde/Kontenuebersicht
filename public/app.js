const app = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");
const translations = {
  "Your accounts.": "Ihre Konten.",
  "Under your key.": "Unter Ihrem Schutz.",
  "A private, encrypted place for your European bank account details. Only your master password can open the vault.": "Ein privater, verschlüsselter Ort für Ihre europäischen Bankdaten. Nur Ihr Masterpasswort öffnet den Tresor.",
  "Private by design · Encrypted on this device": "Privat konzipiert · Auf diesem Gerät verschlüsselt",
  "A safer place for your details": "Ein sicherer Ort für Ihre Daten",
  "Welcome back": "Willkommen zurück",
  "Create your account": "Benutzerkonto erstellen",
  "Sign in to Kontenübersicht": "Bei Kontenübersicht anmelden",
  "Create an account to start your private bank vault.": "Erstellen Sie ein Benutzerkonto für Ihren privaten Banktresor.",
  "Sign in with your account email and password.": "Melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an.",
  "Email address": "E-Mail-Adresse",
  "Nickname / name": "Spitzname / Name",
  "Account password": "Benutzerkonto-Passwort",
  "At least 8 characters.": "Mindestens 8 Zeichen.",
  "Confirm account password": "Benutzerkonto-Passwort bestätigen",
  "Register account": "Benutzerkonto erstellen",
  "Unlock vault": "Tresor entsperren",
  "Working…": "Wird verarbeitet …",
  "Already have an account? Sign in": "Sie haben bereits ein Konto? Anmelden",
  "New here? Create an account": "Neu hier? Benutzerkonto erstellen",
  "Create your master password": "Masterpasswort erstellen",
  "Unlock your private vault": "Privaten Tresor entsperren",
  "Your account is ready. Create a separate master password to encrypt your bank details.": "Ihr Benutzerkonto ist bereit. Erstellen Sie ein separates Masterpasswort, um Ihre Bankdaten zu verschlüsseln.",
  "Enter your master password to decrypt your private bank details.": "Geben Sie Ihr Masterpasswort ein, um Ihre privaten Bankdaten zu entschlüsseln.",
  "The master password is separate from your account password and cannot be recovered.": "Das Masterpasswort ist unabhängig vom Benutzerkonto-Passwort und kann nicht wiederhergestellt werden.",
  "Create your vault": "Tresor erstellen",
  "Sign in to your vault": "Bei Ihrem Tresor anmelden",
  "Set a strong master password to encrypt your bank details. It cannot be recovered if forgotten.": "Legen Sie ein starkes Masterpasswort fest, um Ihre Bankdaten zu verschlüsseln. Ein vergessenes Passwort kann nicht wiederhergestellt werden.",
  "Enter your master password to access your encrypted account details.": "Geben Sie Ihr Masterpasswort ein, um auf Ihre verschlüsselten Kontodaten zuzugreifen.",
  "Master password": "Masterpasswort",
  "Use at least 12 characters. A longer, unique passphrase is best.": "Verwenden Sie mindestens 12 Zeichen. Eine längere, einzigartige Passphrase ist am besten.",
  "Confirm master password": "Masterpasswort bestätigen",
  "Create secure vault": "Sicheren Tresor erstellen",
  "Sign in": "Anmelden",
  "Already set up? Check your vault and sign in": "Schon eingerichtet? Tresor prüfen und anmelden",
  "Workspace": "Arbeitsbereich",
  "Main navigation": "Hauptnavigation",
  "Accounts": "Konten",
  "Options": "Einstellungen",
  "Vault is encrypted": "Tresor ist verschlüsselt",
  "Your details are protected by your master password.": "Ihre Daten sind durch Ihr Masterpasswort geschützt.",
  "Your private vault": "Ihr privater Tresor",
  "Local device": "Lokales Gerät",
  "Log out and lock your vault": "Abmelden und Tresor sperren",
  "Log out": "Abmelden",
  "Encrypted & secure": "Verschlüsselt & sicher",
  "Encrypted &amp; secure": "Verschlüsselt & sicher",
  "Not provided": "Nicht angegeben",
  "Details saved securely": "Daten sicher gespeichert",
  "Secure details saved": "Sichere Daten gespeichert",
  "View account": "Konto anzeigen",
  "Edit account": "Konto bearbeiten",
  "Your secure overview": "Ihre sichere Übersicht",
  "Bank accounts": "Bankkonten",
  "Keep your important account details close, and protected.": "Bewahren Sie Ihre wichtigen Kontodaten griffbereit und geschützt auf.",
  "Add account": "Konto hinzufügen",
  "Saved bank accounts": "Gespeicherte Bankkonten",
  "All protected with your master password": "Alle durch Ihr Masterpasswort geschützt",
  "Private by design": "Privat konzipiert",
  "Your account details are encrypted before they are saved.": "Ihre Kontodaten werden vor dem Speichern verschlüsselt.",
  "Your accounts": "Ihre Konten",
  account: "Konto",
  accounts: "Konten",
  "Your vault is ready": "Ihr Tresor ist bereit",
  "Add your first bank account to get started.": "Fügen Sie Ihr erstes Bankkonto hinzu.",
  "Add your first account": "Erstes Konto hinzufügen",
  "Make it yours": "Persönlich anpassen",
  "Manage your local server and vault security.": "Verwalten Sie Ihren lokalen Server und die Tresorsicherheit.",
  "HTTPS server": "HTTPS-Server",
  "Choose the local HTTPS port used to open this vault. The change takes effect immediately.": "Wählen Sie den lokalen HTTPS-Port für den Zugriff auf diesen Tresor. Die Änderung wird sofort übernommen.",
  "Server port": "Server-Port",
  "Use a free port between 1024 and 65535. Open": "Verwenden Sie einen freien Port zwischen 1024 und 65535. Öffnen Sie",
  "Save port": "Port speichern",
  "Change the password used to unlock and encrypt your vault. Your saved account details will be encrypted again with the new password.": "Ändern Sie das Passwort zum Entsperren und Verschlüsseln Ihres Tresors. Ihre gespeicherten Kontodaten werden mit dem neuen Passwort erneut verschlüsselt.",
  "Current master password": "Aktuelles Masterpasswort",
  "New master password": "Neues Masterpasswort",
  "At least 12 characters. There is no password recovery.": "Mindestens 12 Zeichen. Es gibt keine Passwortwiederherstellung.",
  "Confirm new master password": "Neues Masterpasswort bestätigen",
  "Update master password": "Masterpasswort aktualisieren",
  "If you forget your master password, this app cannot recover your data. Keep a secure backup of your password.": "Wenn Sie Ihr Masterpasswort vergessen, kann diese App Ihre Daten nicht wiederherstellen. Bewahren Sie Ihr Passwort sicher auf.",
  "The passwords do not match.": "Die Passwörter stimmen nicht überein.",
  "The account passwords do not match.": "Die Benutzerkonto-Passwörter stimmen nicht überein.",
  "Account password must be between 8 and 128 characters.": "Das Benutzerkonto-Passwort muss zwischen 8 und 128 Zeichen lang sein.",
  "Enter a valid email address.": "Geben Sie eine gültige E-Mail-Adresse ein.",
  "Name must be between 1 and 80 characters.": "Der Name muss zwischen 1 und 80 Zeichen lang sein.",
  "An account with this email address already exists.": "Für diese E-Mail-Adresse existiert bereits ein Benutzerkonto.",
  "The email address or account password is incorrect.": "Die E-Mail-Adresse oder das Benutzerkonto-Passwort ist falsch.",
  "Enter your email address and account password.": "Geben Sie Ihre E-Mail-Adresse und Ihr Benutzerkonto-Passwort ein.",
  "Your master password changed. Unlock your vault again.": "Ihr Masterpasswort wurde geändert. Entsperren Sie Ihren Tresor erneut.",
  "Registration is already in progress. Try again shortly.": "Die Registrierung läuft bereits. Bitte versuchen Sie es gleich erneut.",
  "Sign in to your account first.": "Melden Sie sich zuerst bei Ihrem Benutzerkonto an.",
  "Your vault has already been set up. Unlock it to continue.": "Ihr Tresor wurde bereits eingerichtet. Entsperren Sie ihn, um fortzufahren.",
  "Set up your master password before unlocking the vault.": "Richten Sie zuerst Ihr Masterpasswort ein, bevor Sie den Tresor entsperren.",
  "Too many attempts. Wait 30 seconds and try again.": "Zu viele Versuche. Warten Sie 30 Sekunden und versuchen Sie es erneut.",
  "The master password is incorrect.": "Das Masterpasswort ist falsch.",
  "Creating encrypted vault…": "Verschlüsselter Tresor wird erstellt …",
  "Unlocking…": "Wird entsperrt …",
  "Your vault is ready. Enter your master password below to unlock it.": "Ihr Tresor ist bereit. Geben Sie unten Ihr Masterpasswort ein, um ihn zu entsperren.",
  "This vault is already set up. Enter your master password to sign in.": "Dieser Tresor ist bereits eingerichtet. Geben Sie Ihr Masterpasswort ein, um sich anzumelden.",
  "No vault has been set up yet. Create your master password to continue.": "Es wurde noch kein Tresor eingerichtet. Erstellen Sie ein Masterpasswort, um fortzufahren.",
  "Account name": "Kontoname",
  "Bank": "Bank",
  "Account holder": "Kontoinhaber",
  "BIC / SWIFT": "BIC / SWIFT",
  "Online banking URL": "Online-Banking-URL",
  Username: "Benutzername",
  "Online banking password": "Online-Banking-Passwort",
  Notes: "Notizen",
  "Private account details": "Private Kontodaten",
  Reveal: "Anzeigen",
  Empty: "Leer",
  Hide: "Ausblenden",
  Copy: "Kopieren",
  "Copied to clipboard": "In die Zwischenablage kopiert",
  "Could not copy to clipboard.": "Kopieren in die Zwischenablage nicht möglich.",
  "Delete account": "Konto löschen",
  Close: "Schließen",
  Permanently: "Endgültig",
  "Port changed. Opening": "Port geändert. Öffne",
  "The server port is already set to this value.": "Der Server verwendet bereits diesen Port.",
  "The new passwords do not match.": "Die neuen Passwörter stimmen nicht überein.",
  "Re-encrypting vault…": "Tresor wird erneut verschlüsselt …",
  "Master password updated. Your vault has been re-encrypted.": "Masterpasswort aktualisiert. Ihr Tresor wurde erneut verschlüsselt.",
  Show: "Anzeigen",
  Retry: "Erneut versuchen",
  "Unable to open your vault.": "Tresor kann nicht geöffnet werden.",
  "Connection unavailable": "Verbindung nicht verfügbar",
  "Check that the HTTPS server is running, then reload this page.": "Prüfen Sie, ob der HTTPS-Server läuft, und laden Sie diese Seite erneut.",
  English: "Englisch",
  German: "Deutsch",
  "Switch language to German": "Sprache auf Deutsch umstellen",
  "Switch language to English": "Sprache auf Englisch umstellen",
  "Switch to dark mode": "Dunkelmodus aktivieren",
  "Switch to light mode": "Hellmodus aktivieren",
  "Account overview": "Kontenübersicht",
  "Appearance": "Darstellung",
  "Choose the default appearance used when the app starts. The top-bar theme toggle only changes the current visit.": "Wählen Sie das Farbschema, das beim Start der App verwendet wird. Der Schalter oben ändert nur die aktuelle Sitzung.",
  "Language": "Sprache",
  "Choose the default language used when the app starts. The sign-in and top-bar language toggles only change the current visit.": "Wählen Sie die Sprache, die beim Start der App verwendet wird. Die Sprachschalter auf der Anmelde- und Hauptseite ändern nur die aktuelle Sitzung.",
  "Default language": "Standardsprache",
  "Default appearance": "Standarddarstellung",
  "Light": "Hell",
  "Dark": "Dunkel",
  Theme: "Darstellung",
  "after saving.": "nach dem Speichern.",
  "Online banking": "Online-Banking",
  "Bank name": "Bankname",
  "Online banking username": "Online-Banking-Benutzername",
  "e.g. Everyday account": "z. B. Girokonto",
  "e.g. Example Bank": "z. B. Beispielbank",
  "Name on the account": "Name des Kontoinhabers",
  "e.g. DE89 3704 0044 0532 0130 00": "z. B. DE89 3704 0044 0532 0130 00",
  "e.g. COBADEFFXXX": "z. B. COBADEFFXXX",
  "Username or customer number": "Benutzername oder Kundennummer",
  "Stored encrypted": "Verschlüsselt gespeichert",
  "Optional private notes": "Optionale private Notizen",
  "Keep details up to date": "Daten aktuell halten",
  "Add to your vault": "Zum Tresor hinzufügen",
  "New bank account": "Neues Bankkonto",
  "All fields are encrypted before they are saved.": "Alle Felder werden vor dem Speichern verschlüsselt.",
  "Save changes": "Änderungen speichern",
  "Save account": "Konto speichern",
  "Saving securely…": "Wird sicher gespeichert …",
  "Account saved securely.": "Konto sicher gespeichert.",
  "Account updated.": "Konto aktualisiert.",
  "from your vault?": "aus Ihrem Tresor?",
  "Account deleted.": "Konto gelöscht.",
  "The master password is incorrect.": "Das Masterpasswort ist falsch.",
  "The current master password is incorrect.": "Das aktuelle Masterpasswort ist falsch.",
  "Account not found.": "Konto nicht gefunden.",
  "Account name and bank name are required.": "Kontoname und Bankname sind erforderlich.",
  "Account details are required.": "Kontodaten sind erforderlich.",
  "The passwords do not match.": "Die Passwörter stimmen nicht überein.",
  "The new passwords do not match.": "Die neuen Passwörter stimmen nicht überein.",
  "The request could not be completed.": "Die Anfrage konnte nicht abgeschlossen werden.",
  "The server returned an unexpected response.": "Der Server hat eine unerwartete Antwort zurückgegeben.",
  "Unlock the vault to continue.": "Entsperren Sie den Tresor, um fortzufahren.",
  "Enter your master password.": "Geben Sie Ihr Masterpasswort ein.",
  "Cancel": "Abbrechen",
  "The IBAN is invalid. Check its format and checksum.": "Die IBAN ist ungültig. Prüfen Sie Format und Prüfsumme.",
  "Enter a valid online banking URL.": "Geben Sie eine gültige Online-Banking-URL ein.",
  "Online banking URLs must use HTTPS.": "Online-Banking-URLs müssen HTTPS verwenden.",
  "Choose a port from 1024 to 65535.": "Wählen Sie einen Port zwischen 1024 und 65535.",
  "The request could not be completed.": "Die Anfrage konnte nicht abgeschlossen werden.",
  "The server returned an unexpected response.": "Der Server hat eine unerwartete Antwort zurückgegeben.",
  "Unlock the vault to continue.": "Entsperren Sie den Tresor, um fortzufahren.",
  "Enter your master password.": "Geben Sie Ihr Masterpasswort ein.",
  "Cancel": "Abbrechen",
};
const defaults = {
  language: localStorage.getItem("vault-default-language")
    || localStorage.getItem("vault-language")
    || "en",
  theme: localStorage.getItem("vault-default-theme")
    || localStorage.getItem("vault-theme")
    || "light",
};
if (!localStorage.getItem("vault-default-language")) {
  localStorage.setItem("vault-default-language", defaults.language);
}
if (!localStorage.getItem("vault-default-theme")) {
  localStorage.setItem("vault-default-theme", defaults.theme);
}
const preferences = {
  language: defaults.language === "de" ? "de" : "en",
  theme: defaults.theme === "dark" ? "dark" : "light",
};
const state = {
  hasUsers: false,
  authenticated: false,
  hasMasterPassword: false,
  unlocked: false,
  user: null,
  authMode: "register",
  port: 4005,
  accounts: [],
  currentView: "accounts",
  selectedAccount: null,
  authNotice: "",
};

function t(text) {
  return preferences.language === "de" ? translations[text] || translateError(text) : text;
}

function translateError(text) {
  if (preferences.language !== "de") return text;
  if (text.startsWith("Invalid ") && text.endsWith(" value.")) {
    const field = text.slice(8, -7);
    const translatedField = {
      accountName: "Kontoname",
      holderName: "Kontoinhaber",
      bankName: "Bankname",
      iban: "IBAN",
      bic: "BIC",
      onlineBankingUrl: "Online-Banking-URL",
      username: "Benutzername",
      password: "Passwort",
      notes: "Notizen",
    }[field] || field;
    return `${translatedField} ist ungültig.`;
  }
  if (text.startsWith("Port ") && text.endsWith(" is unavailable.")) {
    return `Port ${text.slice(5, -15)} ist nicht verfügbar.`;
  }
  return text;
}

function applyPreferences() {
  document.documentElement.lang = preferences.language;
  document.documentElement.dataset.theme = preferences.theme;
  document.title = preferences.language === "de"
    ? "Kontenübersicht — Ihr privater Banktresor"
    : "Account Overview — Your private bank vault";
}
applyPreferences();

function renderPreferenceControls(includeTheme = true) {
  return `<div class="preference-controls">
    <button class="preference-button" type="button" data-toggle-language aria-label="${t(preferences.language === "en" ? "Switch language to German" : "Switch language to English")}" title="${t(preferences.language === "en" ? "Switch language to German" : "Switch language to English")}">${preferences.language === "en" ? "DE" : "EN"}</button>
    ${includeTheme ? `<button class="preference-button theme-toggle" type="button" data-toggle-theme aria-label="${t(preferences.theme === "light" ? "Switch to dark mode" : "Switch to light mode")}" title="${t(preferences.theme === "light" ? "Switch to dark mode" : "Switch to light mode")}"><span aria-hidden="true">${preferences.theme === "light" ? "☾" : "☀"}</span></button>` : ""}
  </div>`;
}

function setLanguage(language) {
  preferences.language = language;
  applyPreferences();
  render();
}

function setTheme(theme) {
  preferences.theme = theme;
  applyPreferences();
  render();
}

function setDefaultLanguage(language) {
  defaults.language = language;
  localStorage.setItem("vault-default-language", language);
  render();
}

function setDefaultTheme(theme) {
  defaults.theme = theme;
  localStorage.setItem("vault-default-theme", theme);
  render();
}

function bindPreferenceControls() {
  document.querySelectorAll("[data-toggle-language]").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(preferences.language === "en" ? "de" : "en");
    });
  });
  document.querySelectorAll("[data-toggle-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(preferences.theme === "light" ? "dark" : "light");
    });
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let result = {};
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response.");
  }
  if (!response.ok) {
    if (response.status === 401 && [
      "Unlock the vault to continue.",
      "Sign in to your account first.",
      "Your master password changed. Unlock your vault again.",
    ].includes(result.error)) {
      if (result.error === "Sign in to your account first.") {
        state.authenticated = false;
        state.user = null;
      }
      state.unlocked = false;
      state.accounts = [];
      window.setTimeout(() => {
        if (!state.unlocked) start();
      }, 0);
    }
    throw new Error(result.error || "The request could not be completed.");
  }
  return result;
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function renderAuth() {
  const stage = state.authenticated
    ? state.hasMasterPassword ? "unlock" : "master-setup"
    : state.hasUsers ? state.authMode : "register";
  const title = {
    register: "Create your account",
    login: "Sign in to Kontenübersicht",
    "master-setup": "Create your master password",
    unlock: "Unlock your private vault",
  }[stage];
  const description = {
    register: "Create an account to start your private bank vault.",
    login: "Sign in with your account email and password.",
    "master-setup": "Your account is ready. Create a separate master password to encrypt your bank details.",
    unlock: "Enter your master password to decrypt your private bank details.",
  }[stage];
  let fields;
  if (stage === "register") {
    fields = `
      <div class="field"><label for="auth-email">${t("Email address")}</label><input id="auth-email" name="email" type="email" maxlength="254" autocomplete="email" required autofocus></div>
      <div class="field"><label for="auth-name">${t("Nickname / name")}</label><input id="auth-name" name="name" type="text" maxlength="80" autocomplete="nickname" required></div>
      <div class="field"><label for="auth-password">${t("Account password")}</label><input id="auth-password" name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required><small>${t("At least 8 characters.")}</small></div>
      <div class="field"><label for="auth-confirm-password">${t("Confirm account password")}</label><input id="auth-confirm-password" name="confirmPassword" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></div>`;
  } else if (stage === "login") {
    fields = `
      <div class="field"><label for="auth-email">${t("Email address")}</label><input id="auth-email" name="email" type="email" maxlength="254" autocomplete="username" required autofocus></div>
      <div class="field"><label for="auth-password">${t("Account password")}</label><input id="auth-password" name="password" type="password" autocomplete="current-password" required></div>`;
  } else {
    const isSetup = stage === "master-setup";
    fields = `
      <div class="field">
        <label for="master-password">${t("Master password")}</label>
        <div class="input-with-action">
          <input id="master-password" name="password" type="password" autocomplete="${isSetup ? "new-password" : "current-password"}" ${isSetup ? 'minlength="12"' : ""} required autofocus>
          <button type="button" data-toggle="master-password">${t("Show")}</button>
        </div>
        ${isSetup ? `<small>${t("Use at least 12 characters. A longer, unique passphrase is best.")}</small>` : ""}
      </div>
      ${isSetup ? `<div class="field"><label for="confirm-password">${t("Confirm master password")}</label><input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" required></div>` : ""}
      <p class="intro">${t("The master password is separate from your account password and cannot be recovered.")}</p>`;
  }
  const submitLabel = {
    register: "Register account",
    login: "Sign in",
    "master-setup": "Create secure vault",
    unlock: "Unlock vault",
  }[stage];
  app.innerHTML = `
    <main class="auth-layout">
      <section class="auth-aside">
        <div class="auth-brand"><span class="brand-mark">K</span><span>${t("Account overview")}</span></div>
        <div class="auth-copy">
          <h1>${t("Your accounts.")}<br>${t("Under your key.")}</h1>
          <p>${t("A private, encrypted place for your European bank account details. Only your master password can open the vault.")}</p>
        </div>
        <div class="auth-foot">${t("Private by design · Encrypted on this device")}</div>
      </section>
      <section class="auth-panel">
        ${renderPreferenceControls()}
        <form id="auth-form" class="auth-card" data-auth-stage="${stage}">
          <p class="eyebrow">${t(stage === "register" ? "A safer place for your details" : "Welcome back")}</p>
          <h2>${t(title)}</h2>
          <p class="intro">${t(description)}</p>
          ${state.authenticated && state.user ? `<p class="intro">${escapeHtml(state.user.name)} · ${escapeHtml(state.user.email)}</p>` : ""}
          ${state.authNotice ? `<div class="success-message" role="status">${escapeHtml(state.authNotice)}</div>` : ""}
          ${fields}
          <div id="auth-error" role="alert"></div>
          <button class="btn btn-primary btn-block" type="submit">${t(submitLabel)} <span aria-hidden="true">→</span></button>
          ${!state.authenticated && state.hasUsers ? `<button class="auth-switch" id="auth-switch" type="button">${t(stage === "register" ? "Already have an account? Sign in" : "New here? Create an account")}</button>` : ""}
        </form>
      </section>
    </main>`;

  document.querySelector("#auth-form").addEventListener("submit", handleAuth);
  document.querySelector("[data-toggle='master-password']")?.addEventListener("click", togglePassword);
  document.querySelector("#auth-switch")?.addEventListener("click", () => {
    state.authMode = stage === "register" ? "login" : "register";
    state.authNotice = "";
    renderAuth();
  });
  bindPreferenceControls();
}

function renderWorkspace() {
  const settingsView = state.currentView === "settings";
  const activeLabel = t(settingsView ? "Options" : "Accounts");
  app.innerHTML = `
    <div class="workspace">
      <aside class="sidebar">
        <div class="brand-lockup"><span class="brand-mark">K</span><span>${t("Account overview")}</span></div>
        <div class="side-label">${t("Workspace")}</div>
        <nav class="nav-list" aria-label="${t("Main navigation")}">
          <button class="nav-item ${settingsView ? "" : "active"}" data-view="accounts">
            <span class="nav-icon" aria-hidden="true">▤</span>${t("Accounts")} <span class="nav-count">${state.accounts.length}</span>
          </button>
          <button class="nav-item ${settingsView ? "active" : ""}" data-view="settings">
            <span class="nav-icon" aria-hidden="true">⚙</span>${t("Options")}
          </button>
        </nav>
        <div class="sidebar-bottom">
          <div class="secure-note">
            <span class="shield" aria-hidden="true">◆</span>
            <div><strong>${t("Vault is encrypted")}</strong><span>${t("Your details are protected by your master password.")}</span></div>
          </div>
          <div class="user-row">
            <span class="user-avatar" aria-hidden="true">${escapeHtml(state.user?.name?.slice(0, 1).toUpperCase() || "Y")}</span>
            <div class="user-meta"><strong>${escapeHtml(state.user?.name || t("Your private vault"))}</strong><span>${escapeHtml(state.user?.email || t("Local device"))}</span></div>
            <button class="logout-button" id="logout-button" type="button" title="${t("Log out and lock your vault")}"><span aria-hidden="true">↪</span><span>${t("Log out")}</span></button>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <div class="breadcrumb">${t("Workspace")} <span aria-hidden="true">/</span> <strong>${activeLabel}</strong></div>
          <div class="topbar-right">${renderPreferenceControls()}<div class="secure-pill"><span class="secure-dot"></span>${t("Encrypted &amp; secure")}</div></div>
        </header>
        ${settingsView ? renderSettings() : renderAccounts()}
      </main>
    </div>`;

  bindBankFavicons();
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      render();
    });
  });
  document.querySelector("#logout-button").addEventListener("click", lockVault);
  bindPreferenceControls();
  if (!settingsView) bindAccountActions();
  else bindSettings();
}

function bindBankFavicons() {
  document.querySelectorAll(".bank-avatar-favicon").forEach((image) => {
    const avatar = image.parentElement;
    const useFallback = () => {
      avatar.classList.remove("has-favicon");
      image.remove();
    };
    image.addEventListener("load", () => avatar.classList.add("has-favicon"), { once: true });
    image.addEventListener("error", useFallback, { once: true });
    if (image.complete) {
      if (image.naturalWidth > 0) avatar.classList.add("has-favicon");
      else useFallback();
    }
  });
}

function renderAccounts() {
  const accountRows = state.accounts.map((account) => {
    const faviconUrl = getBankFaviconUrl(account.onlineBankingUrl);
    return `
    <article class="account-row">
      <div class="bank-avatar" aria-hidden="true">
        <span>${escapeHtml(account.bankName.slice(0, 1).toUpperCase())}</span>
        ${faviconUrl ? `<img class="bank-avatar-favicon" src="${escapeHtml(faviconUrl)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : ""}
      </div>
      <div class="account-main"><strong>${escapeHtml(account.accountName)}</strong><span>${escapeHtml(account.bankName)}</span></div>
      <div class="account-cell"><strong>IBAN</strong><span>${escapeHtml(account.iban || t("Not provided"))}</span></div>
      <div class="account-cell account-iban"><strong>${t("Online banking")}</strong><span>${t(account.iban ? "Details saved securely" : "Secure details saved")}</span></div>
      <div class="account-actions">
        <button class="icon-button" type="button" data-detail="${escapeHtml(account.id)}" aria-label="${t("View account")} ${escapeHtml(account.accountName)}" title="${t("View account")}">↗</button>
        <button class="icon-button" type="button" data-edit="${escapeHtml(account.id)}" aria-label="${t("Edit account")} ${escapeHtml(account.accountName)}" title="${t("Edit account")}">✎</button>
      </div>
    </article>`;
  }).join("");
  return `
    <section class="page">
      <div class="page-heading">
        <div><p class="eyebrow">${t("Your secure overview")}</p><h1 class="page-title">${t("Bank accounts")}</h1><p class="page-subtitle">${t("Keep your important account details close, and protected.")}</p></div>
        <button class="btn btn-primary" id="add-account" type="button"><span aria-hidden="true">＋</span> ${t("Add account")}</button>
      </div>
      <div class="overview-grid">
        <article class="summary-card"><span class="card-label">${t("Saved bank accounts")}</span><strong class="summary-number">${state.accounts.length}</strong><span class="summary-caption">${t("All protected with your master password")}</span></article>
        <article class="safety-card"><span class="safety-icon" aria-hidden="true">✓</span><strong>${t("Private by design")}</strong><p>${t("Your account details are encrypted before they are saved.")}</p></article>
      </div>
      <div class="section-heading"><h2>${t("Your accounts")}</h2><span>${state.accounts.length} ${t(state.accounts.length === 1 ? "account" : "accounts")}</span></div>
      ${state.accounts.length
        ? `<div class="account-list">${accountRows}</div>`
        : `<div class="empty-state"><span class="empty-illustration" aria-hidden="true">＋</span><h3>${t("Your vault is ready")}</h3><p>${t("Add your first bank account to get started.")}</p><button class="btn btn-primary" id="empty-add-account" type="button">${t("Add your first account")}</button></div>`}
    </section>`;
}

function getBankFaviconUrl(onlineBankingUrl) {
  if (!onlineBankingUrl) return "";
  try {
    const url = new URL(onlineBankingUrl);
    return url.protocol === "https:" ? new URL("/favicon.ico", url.origin).href : "";
  } catch {
    return "";
  }
}

function renderSettings() {
  return `
    <section class="page">
      <div class="page-heading"><div><p class="eyebrow">${t("Make it yours")}</p><h1 class="page-title">${t("Options")}</h1><p class="page-subtitle">${t("Manage your local server and vault security.")}</p></div></div>
      <section class="settings-card appearance-card">
        <h2>${t("Appearance")}</h2>
        <p>${t("Choose the default appearance used when the app starts. The top-bar theme toggle only changes the current visit.")}</p>
        <div class="appearance-options">
          <div class="field">
            <label for="theme-select">${t("Default appearance")}</label>
            <select id="theme-select" class="preference-select">
                <option value="light" ${defaults.theme === "light" ? "selected" : ""}>${t("Light")}</option>
                <option value="dark" ${defaults.theme === "dark" ? "selected" : ""}>${t("Dark")}</option>
            </select>
          </div>
        </div>
      </section>
      <section class="settings-card language-card">
        <h2>${t("Language")}</h2>
        <p>${t("Choose the default language used when the app starts. The sign-in and top-bar language toggles only change the current visit.")}</p>
        <div class="appearance-options">
          <div class="field">
            <label for="language-select">${t("Default language")}</label>
            <select id="language-select" class="preference-select">
              <option value="en" ${defaults.language === "en" ? "selected" : ""}>English</option>
              <option value="de" ${defaults.language === "de" ? "selected" : ""}>Deutsch</option>
            </select>
          </div>
        </div>
      </section>
      <section class="settings-card">
        <h2>${t("HTTPS server")}</h2>
        <p>${t("Choose the local HTTPS port used to open this vault. The change takes effect immediately.")}</p>
        <form id="port-form" class="settings-form">
          <div class="field"><label for="server-port">${t("Server port")}</label><input id="server-port" name="port" type="number" min="1024" max="65535" value="${state.port}" required><small>${t("Use a free port between 1024 and 65535. Open")} <strong>https://localhost:<span id="port-preview">${state.port}</span></strong> ${t("after saving.")}</small></div>
          <div id="port-error" role="alert"></div>
          <button class="btn btn-primary" type="submit">${t("Save port")}</button>
        </form>
      </section>
      <section class="settings-card">
        <h2>${t("Master password")}</h2>
        <p>${t("Change the password used to unlock and encrypt your vault. Your saved account details will be encrypted again with the new password.")}</p>
        <form id="password-form" class="settings-form">
          <div class="field"><label for="current-password">${t("Current master password")}</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required></div>
          <div class="field"><label for="new-password">${t("New master password")}</label><input id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="12" required><small>${t("At least 12 characters. There is no password recovery.")}</small></div>
          <div class="field"><label for="confirm-new-password">${t("Confirm new master password")}</label><input id="confirm-new-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" required></div>
          <div id="password-error" role="alert"></div>
          <button class="btn btn-secondary" type="submit">${t("Update master password")}</button>
        </form>
        <div class="security-warning">${t("If you forget your master password, this app cannot recover your data. Keep a secure backup of your password.")}</div>
      </section>
    </section>`;
}

async function handleAuth(event) {
  event.preventDefault();
  const authForm = event.currentTarget;
  const form = new FormData(authForm);
  const stage = authForm.dataset.authStage;
  const password = form.get("password");
  const errorRegion = document.querySelector("#auth-error");
  errorRegion.innerHTML = "";
  state.authNotice = "";
  const checkingMaster = stage === "master-setup";
  const checkingRegistration = stage === "register";
  if ((checkingMaster || checkingRegistration) && password !== form.get("confirmPassword")) {
    errorRegion.innerHTML = `<div class="error-message">${t(checkingRegistration ? "The account passwords do not match." : "The passwords do not match.")}</div>`;
    return;
  }
  const button = authForm.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = t("Working…");
  try {
    const routes = {
      register: ["/api/register", {
        email: form.get("email"),
        name: form.get("name"),
        password,
      }],
      login: ["/api/login", { email: form.get("email"), password }],
      "master-setup": ["/api/master-password/setup", { password }],
      unlock: ["/api/master-password/unlock", { password }],
    };
    const [route, body] = routes[stage];
    await api(route, { method: "POST", body });
    await refreshSession();
    if (state.unlocked) await loadAccounts();
    render();
  } catch (error) {
    errorRegion.innerHTML = `<div class="error-message">${escapeHtml(t(error.message))}</div>`;
    button.disabled = false;
    button.textContent = `${t({
      register: "Register account",
      login: "Sign in",
      "master-setup": "Create secure vault",
      unlock: "Unlock vault",
    }[stage])} →`;
  }
}

async function refreshSession() {
  const session = await api("/api/session");
  state.hasUsers = session.hasUsers;
  state.authenticated = session.authenticated;
  state.hasMasterPassword = session.hasMasterPassword;
  state.unlocked = session.unlocked;
  state.user = session.user;
  state.port = session.port;
  if (state.hasUsers && !state.authenticated) state.authMode = "login";
}

async function loadAccounts() {
  const response = await api("/api/accounts");
  state.accounts = response.accounts;
}

async function lockVault() {
  try {
    await api("/api/lock", { method: "POST", body: {} });
  } catch (error) {
    showToast(t(error.message), true);
  }
  state.authenticated = false;
  state.hasMasterPassword = false;
  state.unlocked = false;
  state.user = null;
  state.accounts = [];
  state.currentView = "accounts";
  state.authMode = "login";
  render();
}

function bindAccountActions() {
  document.querySelector("#add-account")?.addEventListener("click", () => openAccountForm());
  document.querySelector("#empty-add-account")?.addEventListener("click", () => openAccountForm());
  document.querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => openAccountDetails(button.dataset.detail));
  });
  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openAccountForm(button.dataset.edit));
  });
}

async function openAccountForm(accountId = "") {
  let account;
  if (accountId) {
    try {
      ({ account } = await api(`/api/accounts/${encodeURIComponent(accountId)}`));
    } catch (error) {
      showToast(t(error.message), true);
      return;
    }
  }
  const fields = [
    ["accountName", "Account name", "e.g. Everyday account", true],
    ["bankName", "Bank name", "e.g. Example Bank", true],
    ["holderName", "Account holder", "Name on the account"],
    ["iban", "IBAN", "e.g. DE89 3704 0044 0532 0130 00"],
    ["bic", "BIC / SWIFT", "e.g. COBADEFFXXX"],
    ["onlineBankingUrl", "Online banking URL", "https://"],
    ["username", "Online banking username", "Username or customer number"],
    ["password", "Online banking password", "Stored encrypted"],
  ];
  const fieldMarkup = fields.map(([name, label, placeholder, required]) => `
    <div class="field">
      <label for="account-${name}">${t(label)}${required ? " *" : ""}</label>
      <input id="account-${name}" name="${name}" type="${name === "password" ? "password" : "text"}" ${name === "password" ? 'autocomplete="off"' : ""}
        maxlength="${name === "password" ? 1000 : name === "onlineBankingUrl" ? 500 : 200}"
        value="${escapeHtml(account?.[name] || "")}" placeholder="${escapeHtml(t(placeholder))}" ${required ? "required" : ""}>
    </div>`).join("");
  showModal(`
    <div class="modal-header"><div><p class="eyebrow">${t(account ? "Keep details up to date" : "Add to your vault")}</p><h2>${t(account ? "Edit account" : "New bank account")}</h2><p>${t("All fields are encrypted before they are saved.")}</p></div><button class="modal-close" data-close-modal type="button" aria-label="${t("Close")}">×</button></div>
    <form id="account-form">
      <div class="form-grid">
        ${fieldMarkup}
        <div class="field field-wide"><label for="account-notes">${t("Notes")}</label><textarea id="account-notes" name="notes" maxlength="4000" placeholder="${t("Optional private notes")}">${escapeHtml(account?.notes || "")}</textarea></div>
      </div>
      <div id="account-error" role="alert"></div>
      <div class="modal-footer"><button class="btn btn-secondary" data-close-modal type="button">${t("Cancel")}</button><button class="btn btn-primary" type="submit">${t(account ? "Save changes" : "Save account")}</button></div>
    </form>`, "account-form-modal");
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
  document.querySelector("#account-form").addEventListener("submit", (event) => submitAccount(event, accountId));
}

async function submitAccount(event, accountId) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type='submit']");
  const body = Object.fromEntries(new FormData(event.currentTarget));
  button.disabled = true;
  button.textContent = t("Saving securely…");
  document.querySelector("#account-error").innerHTML = "";
  try {
    await api(accountId ? `/api/accounts/${encodeURIComponent(accountId)}` : "/api/accounts", {
      method: accountId ? "PUT" : "POST",
      body,
    });
    await loadAccounts();
    closeModal();
    render();
    showToast(t(accountId ? "Account updated." : "Account saved securely."));
  } catch (error) {
    document.querySelector("#account-error").innerHTML = `<div class="error-message">${escapeHtml(t(error.message))}</div>`;
    button.disabled = false;
    button.textContent = t(accountId ? "Save changes" : "Save account");
  }
}

async function openAccountDetails(accountId) {
  try {
    const { account } = await api(`/api/accounts/${encodeURIComponent(accountId)}`);
    state.selectedAccount = account;
    const details = [
      ["Account name", account.accountName],
      ["Bank", account.bankName],
      ["Account holder", account.holderName],
      ["IBAN", account.iban],
      ["BIC / SWIFT", account.bic],
      ["Online banking URL", account.onlineBankingUrl],
      ["Username", account.username],
      ["Online banking password", account.password, "password"],
      ["Notes", account.notes, "wide"],
    ];
    showModal(`
      <div class="modal-header"><div><p class="eyebrow">${t("Private account details")}</p><h2>${escapeHtml(account.accountName)}</h2><p>${escapeHtml(account.bankName)}</p></div><button class="modal-close" data-close-modal type="button" aria-label="${t("Close")}">×</button></div>
      <div class="detail-grid">${details.map(([label, value, type], index) => `
        <div class="detail-item ${type === "wide" ? "wide" : ""}">
          <span class="detail-label">${t(label)}</span>
          ${type === "password"
            ? `<div class="detail-value-row"><div class="detail-password"><span class="detail-value" data-secret="hidden">${value ? "••••••••" : "—"}</span><button class="btn btn-secondary" id="reveal-password" type="button" ${value ? "" : "disabled"}>${t(value ? "Reveal" : "Empty")}</button></div>${renderCopyButton(label, index, value)}</div>`
            : label === "Online banking URL" && value
              ? `<div class="detail-value-row"><div class="detail-value"><a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a></div>${renderCopyButton(label, index, value)}</div>`
              : `<div class="detail-value-row"><div class="detail-value">${escapeHtml(value || "—")}</div>${renderCopyButton(label, index, value)}</div>`}
        </div>`).join("")}</div>
      <div class="modal-footer"><button class="btn btn-danger" id="delete-account" type="button">${t("Delete account")}</button><button class="btn btn-secondary" data-close-modal type="button">${t("Close")}</button><button class="btn btn-primary" id="edit-account" type="button">${t("Edit account")}</button></div>`, "account-details-modal");
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
    document.querySelectorAll("[data-copy-index]").forEach((button) => button.addEventListener("click", async () => {
      const [, value] = details[Number(button.dataset.copyIndex)];
      try {
        await navigator.clipboard.writeText(String(value));
        showToast(t("Copied to clipboard"));
      } catch {
        showToast(t("Could not copy to clipboard."), true);
      }
    }));
    document.querySelector("#reveal-password").addEventListener("click", (event) => {
      const value = document.querySelector("[data-secret]");
      const revealed = value.dataset.secret === "revealed";
      value.textContent = revealed ? "••••••••" : (account.password || "—");
      value.dataset.secret = revealed ? "hidden" : "revealed";
      event.currentTarget.textContent = t(revealed ? "Reveal" : "Hide");
    });
    document.querySelector("#edit-account").addEventListener("click", () => openAccountForm(accountId));
    document.querySelector("#delete-account").addEventListener("click", () => deleteAccount(accountId, account.accountName));
  } catch (error) {
    showToast(t(error.message), true);
  }
}

function renderCopyButton(label, index, value) {
  const available = value !== null && value !== undefined && String(value).length > 0;
  return `<button class="copy-field-button" type="button" data-copy-index="${index}" aria-label="${t("Copy")} ${t(label)}" title="${t("Copy")} ${t(label)}" ${available ? "" : "disabled"}>
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="7" y="7" width="9" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M13 7V4.8A1.8 1.8 0 0 0 11.2 3H4.8A1.8 1.8 0 0 0 3 4.8v6.4A1.8 1.8 0 0 0 4.8 13H7" stroke="currentColor" stroke-width="1.5"/></svg>
  </button>`;
}

async function deleteAccount(accountId, accountName) {
  if (!window.confirm(preferences.language === "de"
    ? `„${accountName}“ endgültig aus Ihrem Tresor löschen?`
    : `Permanently delete “${accountName}” from your vault?`)) return;
  try {
    await api(`/api/accounts/${encodeURIComponent(accountId)}`, { method: "DELETE" });
    await loadAccounts();
    closeModal();
    render();
    showToast(t("Account deleted."));
  } catch (error) {
    showToast(t(error.message), true);
  }
}

function showModal(markup, modalClass = "") {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "modal-backdrop";
  backdrop.innerHTML = `<section class="modal ${modalClass}" role="dialog" aria-modal="true">${markup}</section>`;
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
  document.body.append(backdrop);
  backdrop.querySelector(".modal-close")?.focus();
}

function closeModal() {
  document.querySelector("#modal-backdrop")?.remove();
}

function bindSettings() {
  document.querySelector("#language-select").addEventListener("change", (event) => {
    setDefaultLanguage(event.currentTarget.value);
  });
  document.querySelector("#theme-select").addEventListener("change", (event) => {
    setDefaultTheme(event.currentTarget.value);
  });
  const portInput = document.querySelector("#server-port");
  portInput.addEventListener("input", () => {
    document.querySelector("#port-preview").textContent = portInput.value;
  });
  document.querySelector("#port-form").addEventListener("submit", submitPort);
  document.querySelector("#password-form").addEventListener("submit", submitPasswordChange);
}

async function submitPort(event) {
  event.preventDefault();
  const port = Number(new FormData(event.currentTarget).get("port"));
  const button = event.currentTarget.querySelector("button[type='submit']");
  const errorRegion = document.querySelector("#port-error");
  errorRegion.innerHTML = "";
  button.disabled = true;
  try {
    const result = await api("/api/settings", { method: "POST", body: { port } });
    state.port = result.port;
    if (result.changed) {
      showToast(`${t("Port changed. Opening")} https://${location.hostname}:${result.port}…`);
      const nextLocation = new URL(location.href);
      nextLocation.port = String(result.port);
      window.setTimeout(() => location.assign(nextLocation), 350);
    } else {
      showToast(t("The server port is already set to this value."));
      button.disabled = false;
    }
  } catch (error) {
    errorRegion.innerHTML = `<div class="error-message">${escapeHtml(t(error.message))}</div>`;
    button.disabled = false;
  }
}

async function submitPasswordChange(event) {
  event.preventDefault();
  const passwordForm = event.currentTarget;
  const form = new FormData(passwordForm);
  const errorRegion = document.querySelector("#password-error");
  const button = passwordForm.querySelector("button[type='submit']");
  errorRegion.innerHTML = "";
  if (form.get("newPassword") !== form.get("confirmPassword")) {
    errorRegion.innerHTML = `<div class="error-message">${t("The new passwords do not match.")}</div>`;
    return;
  }
  button.disabled = true;
  button.textContent = t("Re-encrypting vault…");
  try {
    await api("/api/master-password", {
      method: "POST",
      body: {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      },
    });
    passwordForm.reset();
    showToast(t("Master password updated. Your vault has been re-encrypted."));
  } catch (error) {
    errorRegion.innerHTML = `<div class="error-message">${escapeHtml(t(error.message))}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = t("Update master password");
  }
}

function togglePassword(event) {
  const input = document.getElementById(event.currentTarget.dataset.toggle);
  const visible = input.type === "text";
  input.type = visible ? "password" : "text";
  event.currentTarget.textContent = t(visible ? "Show" : "Hide");
}

async function render() {
  if (!state.unlocked) {
    renderAuth();
    return;
  }
  renderWorkspace();
}

async function start() {
  try {
    await refreshSession();
    if (state.unlocked) await loadAccounts();
    render();
  } catch (error) {
    app.innerHTML = `<main class="auth-layout"><section class="auth-aside"><div class="auth-brand"><span class="brand-mark">K</span><span>${t("Account overview")}</span></div><div class="auth-copy"><h1>${t("Unable to open your vault.")}</h1><p>${escapeHtml(t(error.message))}</p></div></section><section class="auth-panel">${renderPreferenceControls()}<div class="auth-card"><h2>${t("Connection unavailable")}</h2><p class="intro">${t("Check that the HTTPS server is running, then reload this page.")}</p><button class="btn btn-primary" id="retry-server" type="button">${t("Retry")}</button></div></section></main>`;
    document.querySelector("#retry-server").addEventListener("click", () => location.reload());
    bindPreferenceControls();
  }
}

start();
