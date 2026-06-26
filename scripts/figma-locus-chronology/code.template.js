/**
 * Locus Chamber — update Chronology screen in place.
 *
 * Run: node embed-sources.js
 * Then import manifest in Figma and run on the page with a Chronology frame.
 */

/*BACKGROUND_BEGIN*/
const BACKGROUND_BASE64 = "";
/*BACKGROUND_END*/

/*LEAF_BEGIN*/
const LEAF_BASE64 = "";
/*LEAF_END*/

/*ICON_SOURCES_BEGIN*/
const ICON_SOURCES = [];
/*ICON_SOURCES_END*/

const SCREEN_NAMES = ["Chronology", "App — Chronology (mobile)"];
const LEGACY_SCREEN_NAMES = ["chronology"];
const CHRONOLOGY_YEAR_SELECTED_SHELL = "App — Chronology — 2025 selected (mobile)";
const CHRONOLOGY_PHOTOS_SHELL = "App — Chronology — Photos (mobile)";
const PHOTO_FRAME_ICON_NAME = "photo_2026-06-13_19-20-00 (2) 1";
const HIGHLIGHT_YEAR_INDEX = 1;
const SCREEN_GAP = 32;

const W = 390;
const H = 844;
const RADIUS = 40;
const STATUS_H = 44;
const NAV_H = 52;
const TAB_H = 72;
const HOME_INDICATOR_H = 20;
const SIDE = 12;
const LEAF_W = 168;
const LEAF_H = 112;
const LEAF_GAP = 14;
const LEAF_COUNT = 5;
const LEAF_YEARS = ["2026", "2025", "2024", "2023", "2022"];
const CONTENT_TOP = STATUS_H + NAV_H + 16;
const CONTENT_BOTTOM = H - TAB_H - HOME_INDICATOR_H - 8;

const CHRONOLOGY_PHOTOS = [
  { title: "2025-07-12 · 18:44 — Terrace sunset", scene: "terrace-sunset" },
  { title: "2025-06-28 · 11:05 — Kitchen window", scene: "kitchen-window" },
  { title: "2025-06-02 · 09:18 — Morning light", scene: "morning-light" },
  { title: "2025-05-19 · 16:33 — Library corner", scene: "library-corner" },
  { title: "2025-04-03 · 08:02 — Spring blooms", scene: "spring-blooms" },
  { title: "2025-03-14 · 14:32 — Garden path", scene: "garden-path" },
  { title: "2025-02-08 · 20:15 — Evening tea", scene: "evening-tea" },
  { title: "2025-01-22 · 07:50 — Frost on glass", scene: "frost-glass" },
  { title: "2024-12-30 · 22:11 — New Year lights", scene: "new-year-lights" },
  { title: "2024-11-04 · 15:27 — Autumn walk", scene: "autumn-walk" }
];

const TABS = ["Chambers", "Chronology", "Create room", "Archive", "Profile"];
const ACTIVE_TAB = 1;

const THEME = {
  text: "#f8e6c8",
  muted: "#bba987",
  accent: "#f1bd77",
  line: "#d7a663",
  tabBar: "#061524",
  ink: "#02060d",
  surface: "#0f1824"
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

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

function clearFrame(frame) {
  while (frame.children.length > 0) {
    frame.children[0].remove();
  }
}

function allowedChronologyNames() {
  return [
    normalizeName("Chronology"),
    normalizeName("App — Chronology (mobile)"),
    normalizeName(CHRONOLOGY_YEAR_SELECTED_SHELL),
    normalizeName(CHRONOLOGY_PHOTOS_SHELL)
  ].concat(LEGACY_SCREEN_NAMES);
}

function findChronologyShell(page) {
  const primaryNames = SCREEN_NAMES.map(normalizeName);
  for (let i = 0; i < primaryNames.length; i++) {
    const match = page.findOne(function (node) {
      return node.type === "FRAME" && normalizeName(node.name) === primaryNames[i];
    });
    if (match) return match;
  }

  const allowed = allowedChronologyNames();
  const matches = page.findAll(function (node) {
    if (node.type !== "FRAME") return false;
    const name = normalizeName(node.name);
    if (allowed.indexOf(name) === -1) return false;
    return name === normalizeName("Chronology") || name === normalizeName("App — Chronology (mobile)");
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.width * b.height - a.width * a.height;
  });
  return matches[0];
}

function placeShellToRightOf(shell, anchorShell) {
  shell.x = anchorShell.x + W + SCREEN_GAP;
  shell.y = anchorShell.y;
}

function findOrCreateChronologyVariantShell(page, anchorShell, shellName) {
  const target = normalizeName(shellName);
  const existing = page.findAll(function (node) {
    return node.type === "FRAME" && normalizeName(node.name) === target;
  });
  let shell = existing.length ? existing[0] : null;

  if (!shell) {
    shell = figma.createFrame();
    shell.name = shellName;
    shell.resize(W, H);
    shell.cornerRadius = RADIUS;
    page.appendChild(shell);
  }

  placeShellToRightOf(shell, anchorShell);
  return shell;
}

function removeStaleChronologyShells(page, keepIds) {
  const keep = new Set(keepIds);
  const allowed = allowedChronologyNames();
  let removed = 0;

  page.findAll(function (node) {
    if (node.type !== "FRAME") return false;
    const name = normalizeName(node.name);
    if (keep.has(node.id)) return false;
    if (name === normalizeName("Your Chambers")) return false;
    if (allowed.indexOf(name) !== -1) return false;
    return name.indexOf("chronology") !== -1 && node.width >= 300 && node.height >= 700;
  }).forEach(function (node) {
    node.remove();
    removed++;
  });

  return removed;
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

function yearLabelEffects() {
  const accent = hexToRgb(THEME.accent);
  const ink = hexToRgb(THEME.ink);

  return [
    {
      type: "DROP_SHADOW",
      color: { r: ink.r, g: ink.g, b: ink.b, a: 0.78 },
      offset: { x: 0, y: 1 },
      radius: 0,
      visible: true,
      blendMode: "NORMAL"
    },
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.52 },
      offset: { x: 0, y: 3 },
      radius: 6,
      visible: true,
      blendMode: "NORMAL"
    },
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.28 },
      offset: { x: 0, y: 8 },
      radius: 14,
      visible: true,
      blendMode: "NORMAL"
    },
    {
      type: "DROP_SHADOW",
      color: { r: accent.r, g: accent.g, b: accent.b, a: 0.34 },
      offset: { x: 0, y: 0 },
      radius: 10,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
}

function addYearLabel(parent, year, x, y, opts) {
  const highlighted = opts && opts.highlighted;
  const dimmed = opts && opts.dimmed;

  const label = makeText(
    parent,
    "Year " + year,
    year,
    x,
    y + LEAF_H / 2 - 13,
    LEAF_W,
    "Semi Bold",
    highlighted ? 22 : 21,
    highlighted ? THEME.accent : THEME.text,
    highlighted ? 1 : dimmed ? 0.42 : 0.98
  );
  label.textAlignHorizontal = "CENTER";
  label.letterSpacing = { unit: "PERCENT", value: 4 };
  label.effects = yearLabelEffects();
  return label;
}

function leafBlockPosition(index) {
  const leftX = SIDE;
  const rightX = W - SIDE - LEAF_W;
  const totalH = LEAF_COUNT * LEAF_H + (LEAF_COUNT - 1) * LEAF_GAP;
  const availableH = CONTENT_BOTTOM - CONTENT_TOP;
  const startY = CONTENT_TOP + Math.max(0, (availableH - totalH) / 2);
  const y = startY + index * (LEAF_H + LEAF_GAP);
  const mirror = index % 2 === 1;
  const x = mirror ? rightX : leftX;
  return { x, y, mirror };
}

function addLeafHighlight(parent, x, y) {
  const glow = figma.createRectangle();
  glow.name = "Leaf highlight";
  glow.resize(LEAF_W + 18, LEAF_H + 18);
  glow.x = x - 9;
  glow.y = y - 9;
  glow.cornerRadius = 22;
  glow.fills = solid(THEME.accent, 0.14);
  glow.strokes = solid(THEME.line, 0.95);
  glow.strokeWeight = 2.5;
  glow.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 1, g: 0.91, b: 0.72, a: 0.48 },
      offset: { x: 0, y: 0 },
      radius: 16,
      spread: 1,
      visible: true,
      blendMode: "NORMAL"
    },
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.32 },
      offset: { x: 0, y: 6 },
      radius: 12,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  parent.appendChild(glow);
  return glow;
}

function addLeafBlock(parent, leafHash, index, mirror, year, opts) {
  const pos = leafBlockPosition(index);
  const x = pos.x;
  const y = pos.y;
  const highlighted = opts && opts.highlighted;
  const dimmed = opts && opts.dimmed;

  if (highlighted) {
    addLeafHighlight(parent, x, y);
  }

  const wrap = figma.createFrame();
  wrap.name = mirror ? "Leaf block " + (index + 1) + " (mirrored)" : "Leaf block " + (index + 1);
  wrap.resize(LEAF_W, LEAF_H);
  wrap.fills = [];
  wrap.clipsContent = true;
  if (dimmed) wrap.opacity = 0.38;

  const block = figma.createRectangle();
  block.name = "Leaf art";
  block.resize(LEAF_W, LEAF_H);
  block.fills = [{ type: "IMAGE", imageHash: leafHash, scaleMode: "FIT" }];
  wrap.appendChild(block);

  if (mirror) {
    wrap.relativeTransform = [
      [-1, 0, x + LEAF_W],
      [0, 1, y]
    ];
  } else {
    wrap.x = x;
    wrap.y = y;
  }

  parent.appendChild(wrap);
  addYearLabel(parent, year, x, y, { highlighted: highlighted, dimmed: dimmed });

  return wrap;
}

function addStatusBar(parent) {
  makeText(parent, "Status time", "9:41", 24, 14, 60, "Semi Bold", 14, THEME.text, 0.95);
}

function addNav(parent) {
  const nav = figma.createFrame();
  nav.name = "Navigation";
  nav.resize(W, NAV_H);
  nav.y = STATUS_H;
  nav.fills = solid("#061524", 0.18);
  nav.strokes = solid("#ffffff", 0.08);
  nav.strokeWeight = 1;
  parent.appendChild(nav);

  makeText(nav, "Back", "‹", 12, 8, 24, "Regular", 24, THEME.accent, 1);
  const title = makeText(nav, "Screen title", "Chronology", 0, 14, W, "Semi Bold", 17, THEME.text, 1);
  title.textAlignHorizontal = "CENTER";
  return nav;
}

function addTabBar(parent) {
  const bar = figma.createFrame();
  bar.name = "Bottom navigation";
  bar.resize(W, TAB_H);
  bar.y = H - TAB_H - HOME_INDICATOR_H;
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
      label.length > 10 ? 9 : 10,
      active ? THEME.text : THEME.muted,
      active ? 1 : 0.78
    );
    tabLabel.textAlignHorizontal = "CENTER";
  });

  return bar;
}

function addBookGlyph(parent) {
  const cover = figma.createRectangle();
  cover.name = "Book cover";
  cover.resize(16, 20);
  cover.x = 12;
  cover.y = 10;
  cover.cornerRadius = 2;
  cover.fills = solid(THEME.line, 0.88);
  parent.appendChild(cover);

  const page = figma.createRectangle();
  page.name = "Book page";
  page.resize(12, 16);
  page.x = 15;
  page.y = 12;
  page.cornerRadius = 1;
  page.fills = solid(THEME.text, 0.92);
  parent.appendChild(page);

  const spine = figma.createRectangle();
  spine.name = "Book spine";
  spine.resize(3, 20);
  spine.x = 10;
  spine.y = 10;
  spine.fills = solid(THEME.ink, 0.55);
  parent.appendChild(spine);
}

function addThumbRect(parent, name, x, y, w, h, color, opacity, radius) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(w, h);
  node.x = x;
  node.y = y;
  if (radius) node.cornerRadius = radius;
  node.fills = solid(color, opacity == null ? 1 : opacity);
  parent.appendChild(node);
  return node;
}

function addThumbEllipse(parent, name, x, y, w, h, color, opacity) {
  const node = figma.createEllipse();
  node.name = name;
  node.resize(w, h);
  node.x = x;
  node.y = y;
  node.fills = solid(color, opacity == null ? 1 : opacity);
  parent.appendChild(node);
  return node;
}

function drawPhotoThumb(parent, scene) {
  switch (scene) {
    case "terrace-sunset":
      addThumbRect(parent, "Sunset sky", 0, 0, 40, 22, "#d97852", 1);
      addThumbRect(parent, "Warm glow", 0, 8, 40, 14, "#f1bd77", 0.45);
      addThumbEllipse(parent, "Sun", 24, 5, 14, 14, "#ffe3a8", 1);
      addThumbRect(parent, "Terrace floor", 0, 24, 40, 16, "#4a3b2f", 1);
      addThumbRect(parent, "Railing", 0, 24, 40, 2, "#8b7355", 0.9);
      break;

    case "kitchen-window":
      addThumbRect(parent, "Wall", 0, 0, 40, 40, "#2a3440", 1);
      addThumbRect(parent, "Window frame", 8, 6, 24, 28, "#6b543f", 1, 2);
      addThumbRect(parent, "Glass", 11, 9, 18, 22, "#9ec9e8", 0.55, 1);
      addThumbRect(parent, "Light beam", 12, 10, 8, 20, "#f8e6c8", 0.35, 1);
      addThumbRect(parent, "Sill", 8, 30, 24, 4, "#5c4a36", 1, 1);
      break;

    case "morning-light":
      addThumbRect(parent, "Dawn sky", 0, 0, 40, 40, "#6a8fb5", 0.35);
      addThumbRect(parent, "Curtain left", 0, 0, 10, 40, "#c9a57a", 0.75);
      addThumbRect(parent, "Curtain right", 30, 0, 10, 40, "#c9a57a", 0.75);
      addThumbEllipse(parent, "Morning sun", 14, 8, 12, 12, "#ffe9b0", 1);
      addThumbRect(parent, "Light rays", 12, 14, 16, 18, "#fff1c9", 0.28, 2);
      break;

    case "library-corner":
      addThumbRect(parent, "Room shadow", 0, 0, 40, 40, "#1a1410", 1);
      addThumbRect(parent, "Shelf 1", 4, 8, 32, 5, "#5c4030", 1, 1);
      addThumbRect(parent, "Shelf 2", 4, 16, 32, 5, "#5c4030", 1, 1);
      addThumbRect(parent, "Shelf 3", 4, 24, 32, 5, "#5c4030", 1, 1);
      addThumbRect(parent, "Book A", 7, 10, 3, 8, "#8b5a3c", 1, 1);
      addThumbRect(parent, "Book B", 12, 9, 4, 9, "#b87a52", 1, 1);
      addThumbRect(parent, "Book C", 18, 11, 3, 7, "#6d8f6a", 1, 1);
      addThumbRect(parent, "Book D", 24, 18, 4, 8, "#a06848", 1, 1);
      addThumbRect(parent, "Book E", 30, 17, 3, 9, "#7a9a72", 1, 1);
      break;

    case "spring-blooms":
      addThumbRect(parent, "Grass", 0, 24, 40, 16, "#4f7a4a", 1);
      addThumbRect(parent, "Sky", 0, 0, 40, 24, "#8eb8d8", 0.5);
      addThumbEllipse(parent, "Bloom 1", 6, 18, 10, 10, "#f2a6c4", 1);
      addThumbEllipse(parent, "Bloom 2", 18, 14, 12, 12, "#f6bfd6", 1);
      addThumbEllipse(parent, "Bloom 3", 28, 20, 9, 9, "#e995b8", 1);
      addThumbRect(parent, "Stem 1", 10, 22, 2, 10, "#3f6b3a", 1, 1);
      addThumbRect(parent, "Stem 2", 23, 20, 2, 12, "#3f6b3a", 1, 1);
      break;

    case "garden-path":
      addThumbRect(parent, "Grass left", 0, 0, 14, 40, "#4d7548", 1);
      addThumbRect(parent, "Grass right", 26, 0, 14, 40, "#4d7548", 1);
      addThumbRect(parent, "Path", 12, 0, 16, 40, "#b9a48a", 1);
      addThumbRect(parent, "Path shadow", 14, 0, 12, 40, "#9a866f", 0.45);
      addThumbEllipse(parent, "Bush", 2, 26, 10, 8, "#5f8f58", 0.85);
      addThumbEllipse(parent, "Bush 2", 28, 30, 9, 7, "#5f8f58", 0.85);
      break;

    case "evening-tea":
      addThumbRect(parent, "Table", 0, 0, 40, 40, "#241a14", 1);
      addThumbRect(parent, "Table top", 0, 24, 40, 16, "#4a3628", 1);
      addThumbEllipse(parent, "Cup", 12, 18, 16, 12, "#f8e6c8", 0.95);
      addThumbRect(parent, "Cup body", 14, 22, 12, 8, "#d8c4a8", 1, 2);
      addThumbEllipse(parent, "Steam glow", 16, 12, 8, 8, "#f1bd77", 0.35);
      addThumbRect(parent, "Saucer", 10, 28, 20, 4, "#8b7355", 0.8, 2);
      break;

    case "frost-glass":
      addThumbRect(parent, "Cold sky", 0, 0, 40, 40, "#7a9cb8", 0.4);
      addThumbRect(parent, "Window", 6, 4, 28, 32, "#c8dce8", 0.65, 2);
      addThumbRect(parent, "Frost patch 1", 10, 8, 8, 6, "#ffffff", 0.55, 2);
      addThumbRect(parent, "Frost patch 2", 22, 14, 7, 8, "#ffffff", 0.45, 2);
      addThumbRect(parent, "Frost patch 3", 12, 22, 10, 5, "#ffffff", 0.4, 2);
      addThumbRect(parent, "Ice edge", 6, 4, 28, 2, "#e8f4ff", 0.7, 1);
      break;

    case "new-year-lights":
      addThumbRect(parent, "Night", 0, 0, 40, 40, "#0a1220", 1);
      addThumbEllipse(parent, "Light red", 6, 10, 5, 5, "#ff6b6b", 1);
      addThumbEllipse(parent, "Light gold", 16, 6, 5, 5, "#f1bd77", 1);
      addThumbEllipse(parent, "Light green", 28, 12, 5, 5, "#7ecf8c", 1);
      addThumbEllipse(parent, "Light blue", 10, 24, 5, 5, "#7eb8ff", 1);
      addThumbEllipse(parent, "Light warm", 24, 26, 5, 5, "#ffd08a", 1);
      addThumbRect(parent, "Wire", 4, 14, 32, 1, "#4a5568", 0.7);
      addThumbRect(parent, "Wire 2", 8, 28, 24, 1, "#4a5568", 0.55);
      break;

    case "autumn-walk":
      addThumbRect(parent, "Autumn sky", 0, 0, 40, 18, "#9a7d5c", 0.55);
      addThumbRect(parent, "Ground", 0, 18, 40, 22, "#6b4f35", 1);
      addThumbRect(parent, "Tree trunk", 4, 10, 5, 18, "#4a3428", 1, 1);
      addThumbEllipse(parent, "Tree crown", 0, 2, 16, 14, "#b86a32", 0.85);
      addThumbEllipse(parent, "Leaf 1", 18, 26, 6, 4, "#d4843f", 1);
      addThumbEllipse(parent, "Leaf 2", 26, 30, 5, 4, "#c96f2c", 1);
      addThumbEllipse(parent, "Leaf 3", 32, 24, 5, 4, "#e0a04f", 1);
      break;

    default:
      addThumbRect(parent, "Placeholder", 0, 0, 40, 40, THEME.muted, 0.35, 4);
  }
}

function createPopupIconTab(parent, opts) {
  const wrap = figma.createFrame();
  wrap.name = opts.name;
  wrap.resize(44, 44);
  wrap.x = opts.x;
  wrap.y = opts.y;
  wrap.cornerRadius = 14;
  wrap.clipsContent = true;

  if (opts.active) {
    wrap.fills = solid(THEME.accent, 0.22);
    wrap.strokes = solid(THEME.line, 0.92);
    wrap.strokeWeight = 2;
    wrap.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.91, b: 0.72, a: 0.42 },
        offset: { x: 0, y: 0 },
        radius: 12,
        spread: 1,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
  } else if (opts.halfLit) {
    wrap.fills = solid(THEME.accent, 0.16);
    wrap.strokes = solid(THEME.accent, 0.78);
    wrap.strokeWeight = 2;
    wrap.opacity = 0.86;
    wrap.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.91, b: 0.72, a: 0.22 },
        offset: { x: 0, y: 0 },
        radius: 8,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
  } else {
    wrap.fills = solid(THEME.ink, 0.35);
    wrap.strokes = solid(THEME.muted, 0.28);
    wrap.strokeWeight = 1;
    wrap.opacity = 0.55;
  }

  parent.appendChild(wrap);

  if (opts.kind === "book") {
    addBookGlyph(wrap);
  } else if (opts.imageHash) {
    const icon = figma.createRectangle();
    icon.name = opts.imageNodeName || "Photo frame icon";
    icon.resize(44, 44);
    icon.fills = [{ type: "IMAGE", imageHash: opts.imageHash, scaleMode: "FILL" }];
    wrap.appendChild(icon);
  }

  return wrap;
}

function createChronologyPhotoPopup(parent, iconHashes, opts) {
  const rowH = 56;
  const rowGap = 8;
  const headerH = 62;
  const footerPad = 12;
  const popupW = W - 20;
  const listViewportH = 360;
  const contentH = CHRONOLOGY_PHOTOS.length * (rowH + rowGap) - rowGap;
  const popupH = headerH + listViewportH + footerPad;
  const pos = leafBlockPosition(opts.anchorLeafIndex == null ? HIGHLIGHT_YEAR_INDEX : opts.anchorLeafIndex);

  const popup = figma.createFrame();
  popup.name = "Chronology photo popup";
  popup.resize(popupW, popupH);
  popup.x = 10;
  popup.y = Math.min(Math.max(pos.y - 28, CONTENT_TOP), CONTENT_BOTTOM - popupH);
  popup.cornerRadius = 18;
  popup.clipsContent = true;
  popup.fills = solid(THEME.surface, 0.96);
  popup.strokes = solid(THEME.line, 0.58);
  popup.strokeWeight = 1.5;
  popup.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.38 },
      offset: { x: 0, y: 10 },
      radius: 28,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  parent.appendChild(popup);

  const header = figma.createFrame();
  header.name = "Popup header";
  header.resize(popupW, headerH);
  header.fills = solid(THEME.ink, 0.28);
  header.strokes = solid("#ffffff", 0.06);
  header.strokeWeight = 1;
  popup.appendChild(header);

  const tabStartX = popupW / 2 - 54;
  createPopupIconTab(header, {
    name: "Book tab",
    kind: "book",
    x: tabStartX,
    y: 9,
    active: false,
    halfLit: false
  });
  createPopupIconTab(header, {
    name: "Photo tab",
    kind: "photo",
    imageHash: iconHashes[1] || iconHashes[0],
    imageNodeName: PHOTO_FRAME_ICON_NAME,
    x: tabStartX + 58,
    y: 9,
    active: false,
    halfLit: true
  });

  makeText(
    header,
    "Popup title",
    "Photos · 2025",
    16,
    headerH - 18,
    popupW - 32,
    "Medium",
    11,
    THEME.muted,
    0.88
  );

  const listViewport = figma.createFrame();
  listViewport.name = "Photo list viewport";
  listViewport.resize(popupW - 20, listViewportH);
  listViewport.x = 10;
  listViewport.y = headerH + 4;
  listViewport.clipsContent = true;
  listViewport.fills = [];
  popup.appendChild(listViewport);

  const listContent = figma.createFrame();
  listContent.name = "Photo list content";
  listContent.resize(popupW - 28, contentH);
  listContent.x = 0;
  listContent.y = 0;
  listContent.fills = [];
  listViewport.appendChild(listContent);

  CHRONOLOGY_PHOTOS.forEach(function (photo, i) {
    const row = figma.createFrame();
    row.name = "Photo row " + (i + 1);
    row.resize(listContent.width, rowH);
    row.y = i * (rowH + rowGap);
    row.fills = solid("#ffffff", 0.04);
    row.cornerRadius = 12;
    row.strokes = solid(THEME.line, 0.14);
    row.strokeWeight = 1;
    listContent.appendChild(row);

    const thumbWrap = figma.createFrame();
    thumbWrap.name = "Photo thumb — " + photo.scene;
    thumbWrap.resize(40, 40);
    thumbWrap.x = 10;
    thumbWrap.y = 8;
    thumbWrap.cornerRadius = 8;
    thumbWrap.clipsContent = true;
    thumbWrap.fills = solid(THEME.ink, 0.5);
    thumbWrap.strokes = solid(THEME.line, 0.35);
    thumbWrap.strokeWeight = 1;
    row.appendChild(thumbWrap);

    drawPhotoThumb(thumbWrap, photo.scene);

    const label = makeText(
      row,
      "Photo title",
      photo.title,
      58,
      18,
      row.width - 68,
      "Regular",
      11,
      THEME.text,
      0.94
    );
    label.textAutoResize = "HEIGHT";
    label.resize(row.width - 68, label.height);
  });

  const track = figma.createRectangle();
  track.name = "Scroll track";
  track.resize(3, listViewportH - 8);
  track.x = popupW - 12;
  track.y = headerH + 8;
  track.cornerRadius = 2;
  track.fills = solid(THEME.muted, 0.22);
  popup.appendChild(track);

  const thumbH = Math.max(48, Math.round(listViewportH * (listViewportH / contentH)));
  const thumb = figma.createRectangle();
  thumb.name = "Scroll thumb";
  thumb.resize(3, thumbH);
  thumb.x = popupW - 12;
  thumb.y = headerH + 8;
  thumb.cornerRadius = 2;
  thumb.fills = solid(THEME.accent, 0.82);
  popup.appendChild(thumb);

  const fade = figma.createRectangle();
  fade.name = "List fade bottom";
  fade.resize(listViewport.width, 28);
  fade.x = listViewport.x;
  fade.y = listViewport.y + listViewportH - 28;
  fade.fills = [
    {
      type: "GRADIENT_LINEAR",
      gradientTransform: [
        [0, 1, 0],
        [-1, 0, 1]
      ],
      gradientStops: [
        { position: 0, color: { r: 0.06, g: 0.09, b: 0.14, a: 0 } },
        { position: 1, color: { r: 0.06, g: 0.09, b: 0.14, a: 0.92 } }
      ]
    }
  ];
  popup.appendChild(fade);

  return popup;
}

function buildChronologyScreen(shell, backgroundHash, leafHash, iconHashes, options) {
  options = options || {};
  const savedX = shell.x;
  const savedY = shell.y;

  clearFrame(shell);
  shell.name = options.shellName || "Chronology";
  shell.resize(W, H);
  shell.x = savedX;
  shell.y = savedY;
  shell.cornerRadius = RADIUS;
  shell.clipsContent = true;
  shell.fills = solid("#120e0b", 1);
  shell.strokes = solid(THEME.line, 0.24);
  shell.strokeWeight = 1;

  const bg = figma.createRectangle();
  bg.name = "Background";
  bg.resize(W, H);
  bg.fills = [{ type: "IMAGE", imageHash: backgroundHash, scaleMode: "FILL" }];
  shell.appendChild(bg);

  addStatusBar(shell);
  addNav(shell);

  const highlightIndex =
    options.highlightLeafIndex == null ? null : options.highlightLeafIndex;
  const dimOthers = !!options.dimOtherLeaves && highlightIndex != null;

  for (let i = 0; i < LEAF_COUNT; i++) {
    addLeafBlock(shell, leafHash, i, i % 2 === 1, LEAF_YEARS[i], {
      highlighted: highlightIndex === i,
      dimmed: dimOthers && highlightIndex !== i
    });
  }

  if (options.photoPopup && iconHashes && iconHashes.length) {
    createChronologyPhotoPopup(shell, iconHashes, options.photoPopup);
  }

  addTabBar(shell);

  const indicator = figma.createRectangle();
  indicator.name = "Home indicator";
  indicator.resize(120, 4);
  indicator.x = (W - 120) / 2;
  indicator.y = H - 12;
  indicator.cornerRadius = 2;
  indicator.fills = solid(THEME.text, 0.28);
  shell.appendChild(indicator);

  return shell;
}

async function run() {
  await loadFonts();

  if (!BACKGROUND_BASE64 || !LEAF_BASE64) {
    figma.closePlugin("Run node embed-sources.js before using this plugin.");
    return;
  }

  if (!ICON_SOURCES.length || !ICON_SOURCES[0].base64) {
    figma.closePlugin("Run node embed-sources.js before using this plugin.");
    return;
  }

  const page = figma.currentPage;
  const baseShell = findChronologyShell(page);

  if (!baseShell) {
    figma.closePlugin('Chronology frame not found. Add a frame named "Chronology" and run again.');
    return;
  }

  const backgroundHash = figma.createImage(base64ToBytes(BACKGROUND_BASE64)).hash;
  const leafHash = figma.createImage(base64ToBytes(LEAF_BASE64)).hash;
  const iconHashes = ICON_SOURCES.map(function (src) {
    return src && src.base64 ? figma.createImage(base64ToBytes(src.base64)).hash : null;
  }).filter(Boolean);

  const selectedShell = findOrCreateChronologyVariantShell(
    page,
    baseShell,
    CHRONOLOGY_YEAR_SELECTED_SHELL
  );
  const photosShell = findOrCreateChronologyVariantShell(
    page,
    selectedShell,
    CHRONOLOGY_PHOTOS_SHELL
  );

  buildChronologyScreen(baseShell, backgroundHash, leafHash, iconHashes, {
    shellName: baseShell.name === "App — Chronology (mobile)" ? "App — Chronology (mobile)" : "Chronology"
  });

  buildChronologyScreen(selectedShell, backgroundHash, leafHash, iconHashes, {
    shellName: CHRONOLOGY_YEAR_SELECTED_SHELL,
    highlightLeafIndex: HIGHLIGHT_YEAR_INDEX,
    dimOtherLeaves: true
  });

  buildChronologyScreen(photosShell, backgroundHash, leafHash, iconHashes, {
    shellName: CHRONOLOGY_PHOTOS_SHELL,
    highlightLeafIndex: HIGHLIGHT_YEAR_INDEX,
    dimOtherLeaves: true,
    photoPopup: { anchorLeafIndex: HIGHLIGHT_YEAR_INDEX }
  });

  const removedDupes = removeStaleChronologyShells(page, [
    baseShell.id,
    selectedShell.id,
    photosShell.id
  ]);

  figma.viewport.scrollAndZoomIntoView([baseShell, selectedShell, photosShell]);
  figma.closePlugin(
    'Updated Chronology row: base + 2025 selected + Photos popup. Removed stale frames: ' +
      removedDupes +
      "."
  );
}

run().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
