import { getSupabase } from "./supabase-client.js";
import { appLocale, MVP } from "./mvp-settings.js";

const AUTH_DOMAIN = "users.eco-clean-map.app";

const CYRILLIC_TO_LATIN = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

function transliterate(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

export function usernameToSlug(username) {
  return transliterate(username).replace(/[^a-z0-9_]/g, "");
}

export function usernameToEmail(username) {
  const slug = usernameToSlug(username);
  if (slug.length < 2) {
    throw new Error(appLocale() === "ru" ? "Имя: минимум 2 символа (a-z, 0-9, _)" : "Name: min 2 chars (a-z, 0-9, _)");
  }
  return `${slug}@${AUTH_DOMAIN}`;
}

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email.includes("@")) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(appLocale() === "ru" ? "Некорректный email" : "Invalid email address");
  }
  return email;
}

/** Real email or legacy username → auth email. */
export function resolveSignInEmail(login) {
  const trimmed = String(login || "").trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  return usernameToEmail(trimmed);
}

export function formatAuthError(error) {
  const msg = error?.message || String(error);
  const locale = appLocale();
  if (/invalid login credentials|invalid credentials/i.test(msg)) {
    return locale === "ru"
      ? "Неверный email или пароль."
      : "Wrong email or password.";
  }
  if (/email not confirmed|confirm your email/i.test(msg)) {
    return locale === "ru"
      ? "Подтвердите email по ссылке из письма или отключите Confirm email в Supabase."
      : "Confirm your email or disable Confirm email in Supabase Auth.";
  }
  if (/user already registered|already been registered/i.test(msg)) {
    return locale === "ru" ? "Аккаунт уже есть — войдите." : "Account exists — sign in instead.";
  }
  if (/rate limit|too many requests/i.test(msg)) {
    return locale === "ru" ? "Слишком много запросов. Подождите немного." : "Too many requests. Wait a moment.";
  }
  return msg;
}

export async function getSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function loadProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, points, cleanups, is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function signUp({ email, displayName, password }) {
  const supabase = getSupabase();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error(appLocale() === "ru" ? "Укажите email" : "Email is required");
  }
  const name = String(displayName || "").trim();
  if (name.length < 2) {
    throw new Error(appLocale() === "ru" ? "Имя: минимум 2 символа" : "Name: min 2 characters");
  }
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { display_name: name } }
  });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
  if (!data.session) {
    const msg = appLocale() === "ru"
      ? "Аккаунт создан. Проверьте почту или отключите Confirm email в Supabase."
      : "Account created. Check your email or disable Confirm email in Supabase.";
    throw new Error(msg);
  }
  return data;
}

export async function signIn(login, password) {
  const supabase = getSupabase();
  const email = resolveSignInEmail(login);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
  return data;
}

export async function requestPasswordReset(email) {
  const supabase = getSupabase();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error(appLocale() === "ru" ? "Укажите email" : "Email is required");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: MVP.resetRedirectUrl
  });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
}

export async function updatePassword(password) {
  const supabase = getSupabase();
  if (!password || password.length < 6) {
    throw new Error(appLocale() === "ru" ? "Пароль: минимум 6 символов" : "Password: min 6 characters");
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
