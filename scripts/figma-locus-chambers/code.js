/**
 * Locus Chamber — build "Ваши чертоги" screen.
 *
 * Uses background image "photo_2026-06-13_19-20-01 (2) 1" from the file.
 * Run on the page where that image and app screens live.
 */

const SCREEN_NAME = "Ваши чертоги";
const BG_IMAGE_NAMES = [
  "photo_2026-06-13_19-20-01 (2) 1",
  "photo_2026-06-13_19-20-01 (2)",
  "photo_2026-06-13_19-20-01"
];

const W = 390;
const H = 844;
const RADIUS = 40;
const STATUS_H = 44;
const NAV_H = 52;
const TAB_H = 72;
const HOME_INDICATOR_H = 20;
const SIDE = 16;
const CARD_GAP = 12;

const ROOMS = [
  { title: "Вестибюль", subtitle: "Точка входа в чертоги" },
  { title: "Сад воспоминаний", subtitle: "12 воспоминаний" },
  { title: "Замковый коридор", subtitle: "8 воспоминаний" },
  { title: "Гостиная", subtitle: "Ваша комната 1" },
  { title: "Уголок для чтения", subtitle: "4 воспоминания" }
];

const TABS = ["Чертоги", "Библиотека", "Карта", "Архив", "Профиль"];
const ACTIVE_TAB = 0;

const THEME = {
  text: "#f8e6c8",
  muted: "#bba987",
  accent: "#f1bd77",
  line: "#d7a663",
  card: "#061524",
  tabBar: "#061524"
};

function hexToRgb(hex) {
  const value = parseInt(hex.replace("#", ""), 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255
  };
}

function solid(hex, opacity) {
  return [{ type: "SOLID", color: hexToRgb(hex), opacity: opacity == null ? 1 : opacity }];
}

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function findBackgroundNode(root) {
  const matches = root.findAll(function (node) {
    return BG_IMAGE_NAMES.some(function (candidate) {
      return node.name === candidate || node.name.indexOf(candidate) !== -1;
    });
  });

  return (
    matches.find(function (node) {
      return "fills" in node && node.fills && node.fills.some(function (fill) {
        return fill.type === "IMAGE" && fill.visible !== false;
      });
    }) || matches[0] || null
  );
}

function getImageHash(node) {
  if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
  const imageFill = node.fills.find(function (fill) {
    return fill.type === "IMAGE" && fill.visible !== false && fill.imageHash;
  });
  return imageFill ? imageFill.imageHash : null;
}

function removePreviousScreen(page) {
  const old = page.children.filter(function (node) {
    return normalizeName(node.name) === normalizeName(SCREEN_NAME);
  });
  old.forEach(function (node) {
    node.remove();
  });
  return old.length;
}

function findPlacement(page) {
  const frames = page.children.filter(function (node) {
    return node.type === "FRAME" && node.width > 200;
  });

  if (!frames.length) {
    return { x: 0, y: 0 };
  }

  let maxRight = -Infinity;
  let anchorY = 0;

  frames.forEach(function (frame) {
    const right = frame.x + frame.width;
    if (right > maxRight) {
      maxRight = right;
      anchorY = frame.y;
    }
  });

  return { x: maxRight + 48, y: anchorY };
}

function makeRect(parent, name, x, y, w, h, fills, radius) {
  const rect = figma.createRectangle();
  rect.name = name;
  rect.resize(w, h);
  rect.x = x;
  rect.y = y;
  rect.fills = fills || [];
  if (radius != null) rect.cornerRadius = radius;
  parent.appendChild(rect);
  return rect;
}

function makeText(parent, name, text, x, y, width, style, size, color, opacity) {
  const node = figma.createText();
  node.name = name;
  node.fontName = { family: "Inter", style: style };
  node.characters = text;
  node.fontSize = size;
  node.lineHeight = { unit: "PIXELS", value: Math.round(size * 1.35) };
  node.fills = solid(color, opacity == null ? 1 : opacity);
  node.textAutoResize = "HEIGHT";
  node.resize(width, node.height);
  node.x = x;
  node.y = y;
  parent.appendChild(node);
  return node;
}

function addStatusBar(parent) {
  makeText(parent, "Status time", "9:41", 24, 14, 60, "Semi Bold", 14, THEME.text, 0.95);
}

function addNav(parent) {
  const nav = figma.createFrame();
  nav.name = "Navigation";
  nav.resize(W, NAV_H);
  nav.y = STATUS_H;
  nav.fills = solid(THEME.card, 0.18);
  nav.strokes = solid("#ffffff", 0.08);
  nav.strokeWeight = 1;
  parent.appendChild(nav);

  makeText(nav, "Back", "‹", 12, 8, 24, "Regular", 24, THEME.accent, 1);
  makeText(nav, "Screen title", SCREEN_NAME, 0, 14, W, "Semi Bold", 17, THEME.text, 1).textAlignHorizontal = "CENTER";
  return nav;
}

function addRoomCard(parent, room, y, width) {
  const card = figma.createFrame();
  card.name = "Room — " + room.title;
  card.resize(width, 76);
  card.x = SIDE;
  card.y = y;
  card.cornerRadius = 18;
  card.fills = solid(THEME.card, 0.62);
  card.strokes = solid(THEME.line, 0.28);
  card.strokeWeight = 1;
  parent.appendChild(card);

  makeText(card, "Room title", room.title, 16, 16, width - 32, "Semi Bold", 16, THEME.text, 1);
  makeText(card, "Room subtitle", room.subtitle, 16, 42, width - 32, "Regular", 12, THEME.muted, 0.92);

  const chevron = makeText(card, "Chevron", "›", width - 28, 24, 16, "Regular", 22, THEME.accent, 0.9);
  chevron.textAlignHorizontal = "RIGHT";

  return card;
}

function addTabBar(parent, y) {
  const bar = figma.createFrame();
  bar.name = "Bottom navigation";
  bar.resize(W, TAB_H);
  bar.y = y;
  bar.fills = solid(THEME.tabBar, 0.82);
  bar.strokes = solid("#ffffff", 0.1);
  bar.strokeWeight = 1;
  parent.appendChild(bar);

  const slotW = W / TABS.length;

  TABS.forEach(function (label, index) {
    const active = index === ACTIVE_TAB;
    const slot = figma.createFrame();
    slot.name = "Tab — " + label;
    slot.resize(slotW, TAB_H);
    slot.x = slotW * index;
    slot.y = 0;
    slot.fills = [];
    bar.appendChild(slot);

    const dot = figma.createEllipse();
    dot.name = "Tab icon";
    dot.resize(6, 6);
    dot.x = slotW / 2 - 3;
    dot.y = 14;
    dot.fills = solid(active ? THEME.accent : THEME.muted, active ? 1 : 0.45);
    slot.appendChild(dot);

    const tabLabel = makeText(
      slot,
      "Tab label",
      label,
      0,
      28,
      slotW,
      active ? "Semi Bold" : "Regular",
      10,
      active ? THEME.text : THEME.muted,
      active ? 1 : 0.78
    );
    tabLabel.textAlignHorizontal = "CENTER";
  });

  return bar;
}

function buildScreen(page, imageHash) {
  const placement = findPlacement(page);
  const removed = removePreviousScreen(page);

  const screen = figma.createFrame();
  screen.name = SCREEN_NAME;
  screen.resize(W, H);
  screen.x = placement.x;
  screen.y = placement.y;
  screen.cornerRadius = RADIUS;
  screen.clipsContent = true;
  screen.fills = solid("#02060d", 1);
  screen.strokes = solid(THEME.line, 0.24);
  screen.strokeWeight = 1;
  page.appendChild(screen);

  if (imageHash) {
    const bg = makeRect(screen, "Background photo", 0, 0, W, H, [], 0);
    bg.fills = [{ type: "IMAGE", imageHash: imageHash, scaleMode: "FILL" }];
  }

  makeRect(screen, "Background overlay", 0, 0, W, H, solid("#061524", 0.42), 0);

  addStatusBar(screen);
  addNav(screen);

  const contentTop = STATUS_H + NAV_H + 16;
  const contentBottom = H - TAB_H - HOME_INDICATOR_H;
  const listWidth = W - SIDE * 2;
  let cardY = contentTop;

  makeText(screen, "Section title", "Комнаты", SIDE, contentTop - 2, listWidth, "Medium", 12, THEME.accent, 0.95);

  cardY += 28;

  ROOMS.forEach(function (room) {
    addRoomCard(screen, room, cardY, listWidth);
    cardY += 76 + CARD_GAP;
  });

  addTabBar(screen, H - TAB_H - HOME_INDICATOR_H);

  const indicator = makeRect(
    screen,
    "Home indicator",
    (W - 120) / 2,
    H - 12,
    120,
    4,
    solid(THEME.text, 0.28),
    2
  );
  indicator.name = "Home indicator";

  figma.viewport.scrollAndZoomIntoView([screen]);

  return {
    screen: screen,
    removed: removed
  };
}

async function buildChambersScreen() {
  await loadFonts();

  const page = figma.currentPage;
  const bgNode = findBackgroundNode(page);
  const imageHash = getImageHash(bgNode);

  if (!imageHash) {
    figma.closePlugin(
      'Не найдено изображение "' +
        BG_IMAGE_NAMES[0] +
        '". Откройте страницу, где оно лежит в файле, и запустите плагин снова.'
    );
    return;
  }

  const result = buildScreen(page, imageHash);

  figma.closePlugin(
    'Создан экран "' +
      SCREEN_NAME +
      '" с ' +
      ROOMS.length +
      " комнатами и нижним меню на 5 разделов. Удалено старых экранов: " +
      result.removed +
      "."
  );
}

buildChambersScreen().catch(function (err) {
  figma.closePlugin("Ошибка: " + err.message);
});
