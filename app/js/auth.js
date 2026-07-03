import { getSupabase } from "./supabase-client.js";
import { appLocale } from "./mvp-settings.js";

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

export function previewLoginEmail(username) {
  try {
    return usernameToEmail(username);
  } catch (_) {
    return "";
  }
}

export function formatAuthError(error) {
  const msg = error?.message || String(error);
  const locale = appLocale();
  if (/invalid login credentials|invalid credentials/i.test(msg)) {
    return locale === "ru"
      ? "Неверное имя или пароль. Введите латинское имя, как при регистрации (например alice, не Алиса)."
      : "Wrong username or password. Use the latin username from registration (e.g. alice).";
  }
  if (/email not confirmed|confirm your email/i.test(msg)) {
    return locale === "ru"
      ? "Нужно подтверждение email. В Supabase: Authentication → Providers → Email → отключите Confirm email."
      : "Email confirmation required. In Supabase disable Confirm email under Authentication → Providers → Email.";
  }
  if (/user already registered|already been registered/i.test(msg)) {
    return locale === "ru" ? "Аккаунт уже есть — войдите." : "Account exists — sign in instead.";
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

export async function signUp(username, password) {
  const supabase = getSupabase();
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: username.trim() } }
  });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
  if (!data.session) {
    const msg = appLocale() === "ru"
      ? "Аккаунт создан. Отключите подтверждение email в Supabase Auth или войдите."
      : "Account created. Disable email confirm in Supabase Auth, or sign in.";
    throw new Error(msg);
  }
  return data;
}

export async function signIn(username, password) {
  const supabase = getSupabase();
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    error.message = formatAuthError(error);
    throw error;
  }
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
