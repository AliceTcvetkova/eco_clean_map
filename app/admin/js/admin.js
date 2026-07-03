import { getSession, signIn, signOut, formatAuthError, previewLoginEmail } from "../../js/auth.js";
import { photoPublicUrl } from "../../js/photos.js";
import { MVP } from "../../js/mvp-settings.js";
import {
  fetchIsAdmin,
  listPending,
  approveReport,
  rejectReport,
  approveSubmission,
  rejectSubmission
} from "./admin-api.js";

const root = document.getElementById("root");
const toastEl = document.getElementById("toast");
let toastTimer = null;

const state = {
  session: null,
  admin: null,
  tab: "submissions",
  queue: { reports: [], submissions: [] },
  loading: false
};

function locale() {
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function L(key) {
  const ru = {
    title: "Модерация",
    subtitle: "Очередь на проверку",
    reports: "Репорты",
    submissions: "Proof",
    empty: "Ничего на проверке",
    signIn: "Войти",
    signOut: "Выйти",
    refresh: "Обновить",
    approve: "Approve",
    reject: "Reject",
    before: "До",
    after: "После",
    user: "Пользователь",
    reward: "Награда",
    back: "← Приложение",
    loginTitle: "Вход администратора",
    loginHint: "Тот же логин, что в приложении. Флаг is_admin в Supabase.",
    notAdmin: "Нет прав администратора",
    approved: "Одобрено",
    rejected: "Отклонено",
    error: "Ошибка"
  };
  const en = {
    title: "Moderation",
    subtitle: "Pending review queue",
    reports: "Reports",
    submissions: "Proof",
    empty: "Nothing pending",
    signIn: "Sign in",
    signOut: "Sign out",
    refresh: "Refresh",
    approve: "Approve",
    reject: "Reject",
    before: "Before",
    after: "After",
    user: "User",
    reward: "Reward",
    back: "← App",
    loginTitle: "Admin sign in",
    loginHint: "Same login as the app. Set is_admin in Supabase.",
    notAdmin: "Not an admin",
    approved: "Approved",
    rejected: "Rejected",
    error: "Error"
  };
  return (locale() === "ru" ? ru : en)[key] || key;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale() === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderLogin() {
  root.innerHTML = `
    <a class="back-link" href="../">${L("back")}</a>
    <div class="admin-header">
      <h1>${L("loginTitle")}</h1>
      <p>${L("loginHint")}</p>
    </div>
    <div class="admin-login card">
      <form class="auth-form" data-login-form>
        <div class="auth-field">
          <label for="username">${locale() === "ru" ? "Имя" : "Username"}</label>
          <input id="username" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" required minlength="2">
          <p class="auth-login-hint">${locale() === "ru" ? "Латиница: alice, ivan_p" : "Latin only: alice, ivan_p"}</p>
          <p class="auth-login-preview" data-login-preview aria-live="polite"></p>
        </div>
        <div class="auth-field">
          <label for="password">${locale() === "ru" ? "Пароль" : "Password"}</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn btn--primary btn--block">${L("signIn")}</button>
      </form>
      <p class="admin-hint">
        SQL: <code>update profiles set is_admin = true where display_name = 'yourname';</code>
      </p>
      <p class="admin-hint">${locale() === "ru" ? "Забыли пароль? Supabase → Authentication → Users → Send password recovery / Reset." : "Forgot password? Supabase → Authentication → Users → reset there."}</p>
    </div>
  `;
  root.querySelector("[data-login-form]").addEventListener("submit", handleLogin);
  const usernameInput = root.querySelector("#username");
  const preview = root.querySelector("[data-login-preview]");
  if (usernameInput && preview) {
    const update = () => {
      const email = previewLoginEmail(usernameInput.value);
      preview.textContent = email
        ? (locale() === "ru" ? `Вход как: ${email}` : `Login as: ${email}`)
        : "";
    };
    usernameInput.addEventListener("input", update);
    update();
  }
}

function renderReportCard(report) {
  const photo = photoPublicUrl(report.photo_path);
  return `
    <article class="admin-card" data-id="${report.id}" data-type="report">
      <p class="admin-card__meta">${formatDate(report.created_at)} · ${report.category} · ${report.severity}</p>
      <h2 class="admin-card__title">${report.location_name}</h2>
      <p class="admin-card__user">${L("user")}: ${report.user_name || "—"}</p>
      <div class="admin-photos admin-photos--single">
        <figure>
          <img src="${photo}" alt="">
          <figcaption>${L("before")}</figcaption>
        </figure>
      </div>
      <p class="admin-card__meta">${L("reward")}: ${report.reward_points || MVP.rewardPoints} pts</p>
      <div class="admin-actions">
        <button type="button" class="btn btn--primary" data-action="approve-report">${L("approve")}</button>
        <button type="button" class="btn btn--danger" data-action="reject-report">${L("reject")}</button>
      </div>
    </article>
  `;
}

function renderSubmissionCard(sub) {
  const before = photoPublicUrl(sub.before_photo_path);
  const after = photoPublicUrl(sub.after_photo_path);
  return `
    <article class="admin-card" data-id="${sub.id}" data-type="submission">
      <p class="admin-card__meta">${formatDate(sub.created_at)}</p>
      <h2 class="admin-card__title">${sub.task_title || "Task"}</h2>
      <p class="admin-card__user">${L("user")}: ${sub.user_name || "—"} · ${sub.location_name || ""}</p>
      <div class="admin-photos">
        <figure>
          <img src="${before}" alt="">
          <figcaption>${L("before")}</figcaption>
        </figure>
        <figure>
          <img src="${after}" alt="">
          <figcaption>${L("after")}</figcaption>
        </figure>
      </div>
      <p class="admin-card__meta">${L("reward")}: +${sub.reward_points || MVP.rewardPoints} pts</p>
      <div class="admin-actions">
        <button type="button" class="btn btn--primary" data-action="approve-submission">${L("approve")}</button>
        <button type="button" class="btn btn--danger" data-action="reject-submission">${L("reject")}</button>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const items =
    state.tab === "reports"
      ? state.queue.reports.map(renderReportCard).join("")
      : state.queue.submissions.map(renderSubmissionCard).join("");

  root.innerHTML = `
    <a class="back-link" href="../">${L("back")}</a>
    <div class="admin-header">
      <h1>${L("title")}</h1>
      <p>${L("subtitle")} · ${state.admin?.display_name || ""}</p>
    </div>
    <div class="admin-tabs">
      <button type="button" data-tab="submissions" class="${state.tab === "submissions" ? "is-active" : ""}">
        ${L("submissions")} (${state.queue.submissions.length})
      </button>
      <button type="button" data-tab="reports" class="${state.tab === "reports" ? "is-active" : ""}">
        ${L("reports")} (${state.queue.reports.length})
      </button>
    </div>
    <div class="admin-toolbar">
      <button type="button" class="btn btn--secondary" data-action="refresh">${L("refresh")}</button>
      <button type="button" class="btn btn--secondary" data-action="sign-out">${L("signOut")}</button>
    </div>
    <div class="admin-queue">
      ${items || `<p class="admin-empty">${L("empty")}</p>`}
    </div>
  `;
}

async function refreshQueue() {
  state.loading = true;
  try {
    state.queue = await listPending();
  } catch (err) {
    showToast(err.message || L("error"));
  } finally {
    state.loading = false;
    render();
  }
}

async function bootstrap() {
  state.session = await getSession();
  if (!state.session) {
    renderLogin();
    return;
  }
  state.admin = await fetchIsAdmin(state.session.user.id);
  if (!state.admin?.is_admin) {
    renderLogin();
    showToast(L("notAdmin"));
    return;
  }
  await refreshQueue();
}

function render() {
  if (!state.session || !state.admin?.is_admin) {
    renderLogin();
    return;
  }
  renderDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  try {
    await signIn(form.username.value.trim(), form.password.value);
    state.session = await getSession();
    state.admin = await fetchIsAdmin(state.session.user.id);
    if (!state.admin?.is_admin) {
      await signOut();
      state.session = null;
      showToast(L("notAdmin"));
      renderLogin();
      return;
    }
    await refreshQueue();
  } catch (err) {
    showToast(formatAuthError(err));
  }
}

root.addEventListener("click", async (event) => {
  const tabBtn = event.target.closest("[data-tab]");
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab;
    render();
    return;
  }

  const card = event.target.closest(".admin-card");
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (action === "refresh") {
    await refreshQueue();
    return;
  }

  if (action === "sign-out") {
    await signOut();
    state.session = null;
    state.admin = null;
    renderLogin();
    return;
  }

  if (!card) return;
  const id = card.dataset.id;

  try {
    if (action === "approve-report") {
      await approveReport(id);
      showToast(L("approved"));
    } else if (action === "reject-report") {
      await rejectReport(id);
      showToast(L("rejected"));
    } else if (action === "approve-submission") {
      await approveSubmission(id);
      showToast(L("approved"));
    } else if (action === "reject-submission") {
      await rejectSubmission(id);
      showToast(L("rejected"));
    } else {
      return;
    }
    await refreshQueue();
  } catch (err) {
    showToast(err.message || L("error"));
  }
});

bootstrap();
