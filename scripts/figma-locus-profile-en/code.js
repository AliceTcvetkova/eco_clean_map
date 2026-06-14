/**
 * Locus Chamber — translate the My Profile screen to English.
 *
 * Figma: Plugins → Development → Import plugin from manifest…
 * Point to this folder, open the page with My Profile, then Run.
 */

const PROFILE_NAMES = [
  "my profile",
  "profile",
  "мой профиль",
  "мой аккаунт",
  "профиль",
  "аккаунт"
];

const TRANSLATIONS = [
  ["Мой профиль", "My Profile"],
  ["Мой аккаунт", "My account"],
  ["Профиль", "Profile"],
  ["Аккаунт", "Account"],
  ["Настройки аккаунта", "Account settings"],
  ["Настройки", "Settings"],
  ["Личные данные", "Personal information"],
  ["Редактировать профиль", "Edit profile"],
  ["Изменить", "Edit"],
  ["Сохранить изменения", "Save changes"],
  ["Сохранить", "Save"],
  ["Отмена", "Cancel"],
  ["Фамилия", "Last name"],
  ["фамилия", "Last name"],
  ["Фамилия и имя", "Last and first name"],
  ["Имя и фамилия", "First and last name"],
  ["Отчество", "Middle name"],
  ["ФИО", "Full name"],
  ["Полное имя", "Full name"],
  ["Имя", "First name"],
  ["Имя пользователя", "Username"],
  ["Отображаемое имя", "Display name"],
  ["Эл. почта", "Email"],
  ["Адрес эл. почты", "Email address"],
  ["Пароль", "Password"],
  ["Сменить пароль", "Change password"],
  ["Телефон", "Phone"],
  ["Фото", "Photo"],
  ["Аватар", "Avatar"],
  ["Уведомления", "Notifications"],
  ["Push-уведомления", "Push notifications"],
  ["Конфиденциальность", "Privacy"],
  ["Конфиденциальность и безопасность", "Privacy & security"],
  ["Безопасность", "Security"],
  ["Язык", "Language"],
  ["Оформление", "Appearance"],
  ["Тема", "Theme"],
  ["Тёмная тема", "Dark mode"],
  ["Светлая тема", "Light mode"],
  ["Подписка", "Subscription"],
  ["Тариф", "Plan"],
  ["Бесплатный тариф", "Free plan"],
  ["Премиум", "Premium"],
  ["Оплата", "Billing"],
  ["Платёж", "Payment"],
  ["Помощь и поддержка", "Help & support"],
  ["Помощь", "Help"],
  ["Поддержка", "Support"],
  ["О приложении", "About"],
  ["О Locus Chamber", "About Locus Chamber"],
  ["Версия", "Version"],
  ["Выйти", "Log out"],
  ["Удалить аккаунт", "Delete account"],
  ["В сообществе с", "Member since"],
  ["Дата регистрации", "Joined"],
  ["Хранитель памяти", "Memory Keeper"],
  ["Ваши комнаты", "Your rooms"],
  ["Ваша комната 1", "Your room 1"],
  ["Ваша комната", "Your room"],
  ["Комнаты", "Rooms"],
  ["Комната", "Room"],
  ["Библиотека", "Library"],
  ["Воспоминания", "Memories"],
  ["Воспоминание", "Memory"],
  ["Камера", "Chamber"],
  ["Камеры", "Chambers"],
  ["Ваша камера", "Your chamber"],
  ["Ваши камеры", "Your chambers"],
  ["Архив", "Archive"],
  ["Коллекции", "Collections"],
  ["Коллекция", "Collection"],
  ["Папки", "Folders"],
  ["Папка", "Folder"],
  ["Заметки", "Notes"],
  ["Карты", "Maps"],
  ["Книги", "Books"],
  ["Документы", "Docs"],
  ["Ссылки", "Links"],
  ["Люди", "People"],
  ["Места", "Places"],
  ["Вступление", "Opening"],
  ["Гостиная", "Living room"],
  ["Замковый коридор", "Castle corridor"],
  ["Сад воспоминаний", "Memory garden"],
  ["Уголок для чтения", "Study nook"],
  ["Вестибюль", "Entry hall"],
  ["Главная", "Home"],
  ["Назад", "Back"],
  ["Далее", "Next"],
  ["Готово", "Done"],
  ["Продолжить", "Continue"],
  ["Управление", "Manage"],
  ["Смотреть все", "View all"],
  ["Показать ещё", "Show more"],
  ["Свернуть", "Show less"],
  ["Подключено", "Connected"],
  ["Не подключено", "Not connected"],
  ["Подключить", "Connect"],
  ["Отключить", "Disconnect"],
  ["Синхронизация", "Sync"],
  ["Синхронизировано", "Synced"],
  ["Последняя синхронизация", "Last synced"],
  ["Хранилище", "Storage"],
  ["Использовано", "Used"],
  ["Доступно", "Available"],
  ["Всего", "Total"],
  ["Баллы", "Points"],
  ["Значки", "Badges"],
  ["Репутация", "Reputation"],
  ["Выполненные задачи", "Completed tasks"],
  ["Активность", "Activity"],
  ["Статистика", "Statistics"],
  ["Моя статистика", "My statistics"],
  ["Недавняя активность", "Recent activity"],
  ["Предпочтения", "Preferences"],
  ["Данные и конфиденциальность", "Data & privacy"],
  ["Совместный доступ", "Shared access"],
  ["Общий доступ", "Shared access"],
  ["Доступ", "Access"],
  ["Экспорт данных", "Export data"],
  ["Импорт данных", "Import data"],
  ["Восстановить покупки", "Restore purchases"],
  ["Условия использования", "Terms of service"],
  ["Политика конфиденциальности", "Privacy policy"],
  ["Связаться с нами", "Contact us"],
  ["Оставить отзыв", "Give feedback"],
  ["Оценить приложение", "Rate the app"],
  ["Поделиться профилем", "Share profile"],
  ["Поделиться", "Share"],
  ["Скопировать ссылку", "Copy link"],
  ["Скопировано", "Copied"],
  ["Включено", "Enabled"],
  ["Выключено", "Disabled"],
  ["Вкл.", "On"],
  ["Выкл.", "Off"],
  ["Рекомендуется", "Recommended"],
  ["Новое", "New"],
  ["Бета", "Beta"],
  ["Бесплатно", "Free"],
  ["Улучшить тариф", "Upgrade"],
  ["Управление подпиской", "Manage subscription"],
  ["Ваш тариф", "Your plan"],
  ["Текущий тариф", "Current plan"],
  ["Карта воспоминаний", "Memory map"],
  ["Сохранённые элементы", "Saved items"],
  ["Недавние комнаты", "Recent rooms"],
  ["Избранные комнаты", "Favorite rooms"],
  ["Создать комнату", "Create room"],
  ["Открыть библиотеку", "Open library"],
  ["Открыть камеру", "Open chamber"],
  ["Исследовать камеры", "Explore chambers"],
  ["Продолжить исследование", "Keep exploring"],
  ["Профиль обновлён", "Profile updated"],
  ["Изменения сохранены", "Changes saved"],
  ["Пользователь", "User"],
  ["Пользовательский профиль", "User profile"],
  ["Мои данные", "My data"],
  ["Контакты", "Contacts"],
  ["Информация", "Information"],
  ["Дополнительно", "More"],
  ["Показать", "Show"],
  ["Скрыть", "Hide"],
  ["Закрыть", "Close"],
  ["Открыть", "Open"],
  ["Удалить", "Delete"],
  ["Добавить", "Add"],
  ["Обновить", "Refresh"],
  ["Поиск", "Search"],
  ["Фильтр", "Filter"],
  ["Сортировка", "Sort"],
  ["Сегодня", "Today"],
  ["Вчера", "Yesterday"],
  ["Неделя", "Week"],
  ["Месяц", "Month"],
  ["Год", "Year"],
  ["Цветкова Алиса", "Tsvetkova Alice"],
  ["Алиса Цветкова", "Alice Tsvetkova"],
  ["Цветкова", "Tsvetkova"],
  ["Алиса", "Alice"]
];

const EXACT_MAP = new Map();
const PHRASES = TRANSLATIONS.slice().sort(function (a, b) {
  return b[0].length - a[0].length;
});

TRANSLATIONS.forEach(function (pair) {
  EXACT_MAP.set(normalizeKey(pair[0]), pair[1]);
});

function normalizeKey(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function translateString(text) {
  if (!text || !text.trim()) return text;

  const exactKey = normalizeKey(text);
  if (EXACT_MAP.has(exactKey)) {
    return EXACT_MAP.get(exactKey);
  }

  let result = text;
  let changed = false;

  PHRASES.forEach(function (pair) {
    const pattern = new RegExp(escapeRegex(pair[0]), "gi");
    if (pattern.test(result)) {
      result = result.replace(pattern, pair[1]);
      changed = true;
    }
  });

  return changed ? result : text;
}

function findProfileFrame(root) {
  const allowed = new Set(PROFILE_NAMES.map(normalizeKey));
  const direct = root.children.find(function (node) {
    return allowed.has(normalizeKey(node.name));
  });
  if (direct) return direct;

  const matches = root.findAll(function (node) {
    const name = normalizeKey(node.name);
    return PROFILE_NAMES.some(function (candidate) {
      return name.indexOf(candidate) !== -1;
    });
  });

  return matches.find(function (node) {
    return node.type === "FRAME";
  }) || matches[0] || null;
}

async function loadFontsForText(node) {
  const segments = node.getStyledTextSegments(["fontName"]);
  const seen = new Set();

  for (let i = 0; i < segments.length; i++) {
    const font = segments[i].fontName;
    const key = font.family + "::" + font.style;
    if (seen.has(key)) continue;
    seen.add(key);
    await figma.loadFontAsync(font);
  }
}

async function translateTextNode(node) {
  const original = node.characters;
  const translated = translateString(original);
  if (translated === original) return null;

  await loadFontsForText(node);
  node.characters = translated;
  return node;
}

function renameMatchingNodes(root) {
  const renamed = [];

  function maybeRename(node) {
    const translatedName = translateString(node.name);
    if (translatedName !== node.name) {
      node.name = translatedName;
      renamed.push(node);
    }
  }

  maybeRename(root);
  root.findAll(function (node) {
    return node.type !== "TEXT";
  }).forEach(maybeRename);

  return renamed;
}

async function translateProfile() {
  const page = figma.currentPage;
  const profile = findProfileFrame(page);

  if (!profile) {
    figma.closePlugin('My Profile frame not found. Open the page with this screen and run the plugin again.');
    return;
  }

  const textNodes = profile.findAll(function (node) {
    return node.type === "TEXT";
  });

  const translatedNodes = [];
  const unchanged = new Set();

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    const before = node.characters;
    const updated = await translateTextNode(node);
    if (updated) {
      translatedNodes.push(updated);
    } else if (before && before.trim()) {
      unchanged.add(before.trim());
    }
  }

  const renamedNodes = renameMatchingNodes(profile);

  if (normalizeKey(profile.name) !== "my profile") {
    profile.name = "My Profile";
  }

  figma.viewport.scrollAndZoomIntoView([profile]);

  const unchangedList = Array.from(unchanged).slice(0, 8);
  const suffix =
    unchangedList.length > 0
      ? " Not translated: " + unchangedList.join(" · ")
      : "";

  figma.closePlugin(
    "Translated " +
      translatedNodes.length +
      " text layers. Renamed " +
      renamedNodes.length +
      " elements." +
      suffix
  );
}

translateProfile().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
