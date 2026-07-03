import { getSupabase } from "./supabase-client.js";
import { appLocale, t } from "./mvp-settings.js";
import { formatAuthError, updatePassword } from "./auth.js";

const root = document.getElementById("root");
const toastEl = document.getElementById("toast");
let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2800);
}

function renderForm(ready) {
  if (!ready) {
    root.innerHTML = `
      <div class="admin-header">
        <h1>${t("forgotTitle")}</h1>
        <p>${t("resetInvalid")}</p>
      </div>
      <a class="back-link" href="./">${t("backToSignIn")}</a>
    `;
    return;
  }

  root.innerHTML = `
    <div class="admin-header">
      <h1>${t("newPassword")}</h1>
      <p>${appLocale() === "ru" ? "Придумайте новый пароль" : "Choose a new password"}</p>
    </div>
    <div class="admin-login card">
      <form class="auth-form" data-reset-form>
        <div class="auth-field">
          <label for="password">${t("newPassword")}</label>
          <input id="password" name="password" type="password" autocomplete="new-password" required minlength="6">
        </div>
        <button type="submit" class="btn btn--primary btn--block">${t("savePassword")}</button>
      </form>
    </div>
  `;

  root.querySelector("[data-reset-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = event.target.password.value;
    try {
      await updatePassword(password);
      showToast(t("passwordUpdated"));
      setTimeout(() => {
        window.location.href = "./";
      }, 1200);
    } catch (err) {
      showToast(formatAuthError(err));
    }
  });
}

async function init() {
  const supabase = getSupabase();
  const hash = window.location.hash || "";
  const isRecovery = hash.includes("type=recovery") || hash.includes("access_token");

  if (isRecovery) {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    renderForm(true);
    return;
  }

  if (isRecovery) {
    await new Promise((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === "PASSWORD_RECOVERY" || nextSession) {
          subscription.unsubscribe();
          resolve();
        }
      });
      setTimeout(resolve, 2500);
    });
    const { data: { session: retry } } = await supabase.auth.getSession();
    renderForm(!!retry);
    return;
  }

  renderForm(false);
}

init();
