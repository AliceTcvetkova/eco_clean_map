/**
 * Locus Chamber — build Your Chambers screens and Create room.
 *
 * Uses background image "photo_2026-06-13_19-20-01 (2) 1" from the file.
 * Run on the page where that image and app screens live.
 */

const SCREEN_NAME = "Your Chambers";
const SCREEN_NAME_VARIANT = "Your Chambers 2";
const CREATE_ROOM_SCREEN = "Create room";
const LEGACY_SCREEN_NAMES = ["ваши чертоги", "your chambers"];
const HIGHLIGHT_ROOM_INDEX = 2;
const CREATE_ROOM_ACTIVE_TAB = 2;
const SCREEN_GAP = 32;
const BG_IMAGE_PRIMARY = "photo_2026-06-13_19-20-01 (2) 1";
const BG_IMAGE_NAMES = [
  "photo_2026-06-13_19-20-01 (2) 1",
  "photo_2026-06-13_19-20-01 (2)"
];
const BG_IMAGE_EXCLUDE = "photo_2026-06-13_19-20-01 1";

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
  { title: "Library", subtitle: "Your memory archive" },
  { title: "Shop", subtitle: "Memory artifacts and tools" },
  { title: "Memory Garden", subtitle: "Indoor memory garden" },
  { title: "Desk", subtitle: "Your working space" },
  { title: "Living Room", subtitle: "Your room 1" }
];

const TABS = ["Chambers", "Chronology", "Create room", "Archive", "Profile"];
const SECTION_TITLE = "Rooms";
const ACTIVE_TAB = 0;

const ROOM_TYPE_OPTIONS = [
  "Bedroom",
  "living room",
  "kitchen",
  "garden of memories",
  "desk",
  "store",
  "library",
  "cozy window",
  "attic"
];

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

function hasImageFill(node) {
  return (
    "fills" in node &&
    node.fills &&
    node.fills.some(function (fill) {
      return fill.type === "IMAGE" && fill.visible !== false;
    })
  );
}

function findBackgroundNode(root) {
  const withImage = root.findAll(function (node) {
    return hasImageFill(node);
  });

  let match = withImage.find(function (node) {
    return node.name === BG_IMAGE_PRIMARY;
  });
  if (match) return match;

  for (let i = 0; i < BG_IMAGE_NAMES.length; i++) {
    match = withImage.find(function (node) {
      return node.name === BG_IMAGE_NAMES[i];
    });
    if (match) return match;
  }

  match = withImage.find(function (node) {
    return (
      node.name.indexOf("photo_2026-06-13_19-20-01") !== -1 &&
      node.name.indexOf("(2)") !== -1 &&
      normalizeName(node.name) !== normalizeName(BG_IMAGE_EXCLUDE)
    );
  });
  if (match) return match;

  return null;
}

function getImageHash(node) {
  if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
  const imageFill = node.fills.find(function (fill) {
    return fill.type === "IMAGE" && fill.visible !== false && fill.imageHash;
  });
  return imageFill ? imageFill.imageHash : null;
}

function clearFrame(frame) {
  while (frame.children.length > 0) {
    frame.children[0].remove();
  }
}

function findChambersShell(page, name) {
  const target = normalizeName(name);
  const matches = page.findAll(function (node) {
    return node.type === "FRAME" && normalizeName(node.name) === target;
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.width * b.height - a.width * a.height;
  });
  return matches[0];
}

function removePreviousScreen(page) {
  const names = new Set([normalizeName(SCREEN_NAME)].concat(LEGACY_SCREEN_NAMES));
  const old = page.children.filter(function (node) {
    return names.has(normalizeName(node.name));
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

function navTitleForScreen(screenName) {
  if (normalizeName(screenName) === normalizeName(SCREEN_NAME_VARIANT)) return SCREEN_NAME;
  if (normalizeName(screenName) === normalizeName(CREATE_ROOM_SCREEN)) return CREATE_ROOM_SCREEN;
  return screenName;
}

function addNav(parent, title) {
  const nav = figma.createFrame();
  nav.name = "Navigation";
  nav.resize(W, NAV_H);
  nav.y = STATUS_H;
  nav.fills = solid(THEME.card, 0.18);
  nav.strokes = solid("#ffffff", 0.08);
  nav.strokeWeight = 1;
  parent.appendChild(nav);

  makeText(nav, "Back", "‹", 12, 8, 24, "Regular", 24, THEME.accent, 1);
  const navTitle = makeText(
    nav,
    "Screen title",
    title,
    0,
    14,
    W,
    "Semi Bold",
    17,
    THEME.text,
    1
  );
  navTitle.textAlignHorizontal = "CENTER";
  return nav;
}

function addRoomCard(parent, room, y, width, opts) {
  const highlighted = opts && opts.highlighted;
  const dimmed = opts && opts.dimmed;
  const cardW = width;

  if (highlighted) {
    const glow = figma.createRectangle();
    glow.name = "Room highlight";
    glow.resize(cardW + 12, 88);
    glow.x = SIDE - 6;
    glow.y = y - 6;
    glow.cornerRadius = 22;
    glow.fills = solid(THEME.accent, 0.12);
    glow.strokes = solid(THEME.line, 0.88);
    glow.strokeWeight = 2;
    glow.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.91, b: 0.72, a: 0.4 },
        offset: { x: 0, y: 0 },
        radius: 14,
        spread: 1,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.28 },
        offset: { x: 0, y: 6 },
        radius: 12,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
    parent.appendChild(glow);
  }

  const card = figma.createFrame();
  card.name = "Room — " + room.title;
  card.resize(cardW, 76);
  card.x = SIDE;
  card.y = y;
  card.cornerRadius = 18;
  card.fills = solid(THEME.card, highlighted ? 0.74 : 0.62);
  card.strokes = solid(THEME.line, highlighted ? 0.72 : 0.28);
  card.strokeWeight = highlighted ? 2 : 1;
  if (dimmed) card.opacity = 0.42;
  if (highlighted) {
    card.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.22 },
        offset: { x: 0, y: 4 },
        radius: 10,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
  }
  parent.appendChild(card);

  makeText(
    card,
    "Room title",
    room.title,
    16,
    16,
    cardW - 32,
    "Semi Bold",
    16,
    highlighted ? THEME.accent : THEME.text,
    1
  );
  makeText(card, "Room subtitle", room.subtitle, 16, 42, cardW - 32, "Regular", 12, THEME.muted, highlighted ? 1 : 0.92);

  const chevron = makeText(
    card,
    "Chevron",
    "›",
    cardW - 28,
    24,
    16,
    "Regular",
    22,
    THEME.accent,
    highlighted ? 1 : 0.9
  );
  chevron.textAlignHorizontal = "RIGHT";

  return card;
}

function addTabBar(parent, y, activeTabIndex) {
  const activeIndex = activeTabIndex == null ? ACTIVE_TAB : activeTabIndex;
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
    const active = index === activeIndex;
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

function addRoomTypeListField(parent, y, width, height) {
  const field = figma.createFrame();
  field.name = "Room type list field";
  field.resize(width, height);
  field.x = SIDE;
  field.y = y;
  field.cornerRadius = 18;
  field.fills = solid(THEME.card, 0.72);
  field.strokes = solid(THEME.line, 0.38);
  field.strokeWeight = 1.5;
  field.clipsContent = true;
  parent.appendChild(field);

  makeText(
    field,
    "Field label",
    "Choose a room type",
    16,
    14,
    width - 32,
    "Medium",
    12,
    THEME.muted,
    0.9
  );

  const listTop = 38;
  const listPad = 12;
  const listViewportH = height - listTop - listPad;
  const listViewport = figma.createFrame();
  listViewport.name = "Room type list viewport";
  listViewport.resize(width - listPad * 2, listViewportH);
  listViewport.x = listPad;
  listViewport.y = listTop;
  listViewport.clipsContent = true;
  listViewport.cornerRadius = 12;
  listViewport.fills = solid("#ffffff", 0.03);
  listViewport.strokes = solid(THEME.line, 0.16);
  listViewport.strokeWeight = 1;
  field.appendChild(listViewport);

  const rowH = 44;
  const contentH = ROOM_TYPE_OPTIONS.length * rowH;
  const listContent = figma.createFrame();
  listContent.name = "Room type list content";
  listContent.resize(listViewport.width, contentH);
  listContent.fills = [];
  listViewport.appendChild(listContent);

  ROOM_TYPE_OPTIONS.forEach(function (label, index) {
    const row = figma.createFrame();
    row.name = "Room type — " + label;
    row.resize(listContent.width, rowH);
    row.y = index * rowH;
    row.fills = [];
    listContent.appendChild(row);

    makeText(row, "Room type label", label, 14, 13, row.width - 28, "Regular", 15, THEME.text, 0.96);

    if (index < ROOM_TYPE_OPTIONS.length - 1) {
      const divider = figma.createRectangle();
      divider.name = "Divider";
      divider.resize(row.width - 28, 1);
      divider.x = 14;
      divider.y = rowH - 1;
      divider.fills = solid(THEME.line, 0.18);
      row.appendChild(divider);
    }
  });

  if (contentH > listViewportH) {
    const track = figma.createRectangle();
    track.name = "Scroll track";
    track.resize(3, listViewportH - 8);
    track.x = field.width - 10;
    track.y = listTop + 4;
    track.cornerRadius = 2;
    track.fills = solid(THEME.muted, 0.22);
    field.appendChild(track);

    const thumbH = Math.max(40, Math.round(listViewportH * (listViewportH / contentH)));
    const thumb = figma.createRectangle();
    thumb.name = "Scroll thumb";
    thumb.resize(3, thumbH);
    thumb.x = field.width - 10;
    thumb.y = listTop + 4;
    thumb.cornerRadius = 2;
    thumb.fills = solid(THEME.accent, 0.82);
    field.appendChild(thumb);

    const fade = figma.createRectangle();
    fade.name = "List fade bottom";
    fade.resize(listViewport.width, 24);
    fade.x = listViewport.x;
    fade.y = listViewport.y + listViewportH - 24;
    fade.fills = [
      {
        type: "GRADIENT_LINEAR",
        gradientTransform: [
          [0, 1, 0],
          [-1, 0, 1]
        ],
        gradientStops: [
          { position: 0, color: { r: 0.024, g: 0.039, b: 0.071, a: 0 } },
          { position: 1, color: { r: 0.024, g: 0.039, b: 0.071, a: 0.92 } }
        ]
      }
    ];
    field.appendChild(fade);
  }

  return field;
}

function buildScreen(page, imageHash, options) {
  options = options || {};
  const screenName = options.screenName || SCREEN_NAME;
  let screen = options.existingShell;

  if (!screen) {
    screen = figma.createFrame();
    page.appendChild(screen);
  }

  const savedX = screen.x;
  const savedY = screen.y;

  clearFrame(screen);
  screen.name = screenName;
  screen.resize(W, H);
  screen.cornerRadius = RADIUS;
  screen.clipsContent = true;
  screen.fills = solid("#02060d", 1);
  screen.strokes = solid(THEME.line, 0.24);
  screen.strokeWeight = 1;

  if (options.placementAnchor) {
    screen.x = options.placementAnchor.x + W + SCREEN_GAP;
    screen.y = options.placementAnchor.y;
  } else if (options.x != null && options.y != null) {
    screen.x = options.x;
    screen.y = options.y;
  } else {
    screen.x = savedX;
    screen.y = savedY;
  }

  if (imageHash) {
    const bg = makeRect(screen, "Background photo", 0, 0, W, H, [], 0);
    bg.fills = [{ type: "IMAGE", imageHash: imageHash, scaleMode: "FILL" }];
  }

  makeRect(screen, "Background overlay", 0, 0, W, H, solid("#061524", 0.42), 0);

  addStatusBar(screen);
  addNav(screen, navTitleForScreen(screenName));

  const contentTop = STATUS_H + NAV_H + 16;
  const listWidth = W - SIDE * 2;
  let cardY = contentTop;
  const highlightIndex =
    options.highlightRoomIndex == null ? null : options.highlightRoomIndex;
  const dimOthers = !!options.dimOtherRooms && highlightIndex != null;

  makeText(screen, "Section title", SECTION_TITLE, SIDE, contentTop - 2, listWidth, "Medium", 12, THEME.accent, 0.95);

  cardY += 28;

  ROOMS.forEach(function (room, index) {
    addRoomCard(screen, room, cardY, listWidth, {
      highlighted: highlightIndex === index,
      dimmed: dimOthers && highlightIndex !== index
    });
    cardY += 76 + CARD_GAP;
  });

  addTabBar(screen, H - TAB_H - HOME_INDICATOR_H, ACTIVE_TAB);

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

  return screen;
}

function buildCreateRoomScreen(page, imageHash, options) {
  options = options || {};
  let screen = options.existingShell;

  if (!screen) {
    screen = figma.createFrame();
    page.appendChild(screen);
  }

  const savedX = screen.x;
  const savedY = screen.y;

  clearFrame(screen);
  screen.name = CREATE_ROOM_SCREEN;
  screen.resize(W, H);
  screen.cornerRadius = RADIUS;
  screen.clipsContent = true;
  screen.fills = solid("#02060d", 1);
  screen.strokes = solid(THEME.line, 0.24);
  screen.strokeWeight = 1;

  if (options.placementAnchor) {
    screen.x = options.placementAnchor.x + W + SCREEN_GAP;
    screen.y = options.placementAnchor.y;
  } else if (options.x != null && options.y != null) {
    screen.x = options.x;
    screen.y = options.y;
  } else {
    screen.x = savedX;
    screen.y = savedY;
  }

  if (imageHash) {
    const bg = makeRect(screen, "Background photo", 0, 0, W, H, [], 0);
    bg.fills = [{ type: "IMAGE", imageHash: imageHash, scaleMode: "FILL" }];
  }

  makeRect(screen, "Background overlay", 0, 0, W, H, solid("#061524", 0.42), 0);

  addStatusBar(screen);
  addNav(screen, CREATE_ROOM_SCREEN);

  const contentTop = STATUS_H + NAV_H + 16;
  const contentBottom = H - TAB_H - HOME_INDICATOR_H - 8;
  const fieldH = contentBottom - contentTop;
  addRoomTypeListField(screen, contentTop, W - SIDE * 2, fieldH);

  addTabBar(screen, H - TAB_H - HOME_INDICATOR_H, CREATE_ROOM_ACTIVE_TAB);

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

  return screen;
}

async function buildChambersScreen() {
  await loadFonts();

  const page = figma.currentPage;
  const bgNode = findBackgroundNode(page);
  const imageHash = getImageHash(bgNode);

  if (!imageHash) {
    figma.closePlugin(
      'Background image "' +
        BG_IMAGE_PRIMARY +
        '" not found. Open the page where it lives in the file and run the plugin again.'
    );
    return;
  }

  let baseShell = findChambersShell(page, SCREEN_NAME);
  let removed = 0;

  if (!baseShell) {
    removed = removePreviousScreen(page);
    const placement = findPlacement(page);
    baseShell = figma.createFrame();
    baseShell.resize(W, H);
    baseShell.cornerRadius = RADIUS;
    baseShell.x = placement.x;
    baseShell.y = placement.y;
    page.appendChild(baseShell);
  }

  buildScreen(page, imageHash, {
    screenName: SCREEN_NAME,
    existingShell: baseShell
  });

  let variantShell = findChambersShell(page, SCREEN_NAME_VARIANT);
  if (!variantShell) {
    variantShell = figma.createFrame();
    variantShell.resize(W, H);
    variantShell.cornerRadius = RADIUS;
    page.appendChild(variantShell);
  }

  buildScreen(page, imageHash, {
    screenName: SCREEN_NAME_VARIANT,
    existingShell: variantShell,
    placementAnchor: baseShell,
    highlightRoomIndex: HIGHLIGHT_ROOM_INDEX,
    dimOtherRooms: true
  });

  let createRoomShell = findChambersShell(page, CREATE_ROOM_SCREEN);
  if (!createRoomShell) {
    const placement = findPlacement(page);
    createRoomShell = figma.createFrame();
    createRoomShell.resize(W, H);
    createRoomShell.cornerRadius = RADIUS;
    createRoomShell.x = placement.x;
    createRoomShell.y = placement.y;
    page.appendChild(createRoomShell);
  }

  buildCreateRoomScreen(page, imageHash, {
    existingShell: createRoomShell
  });

  figma.viewport.scrollAndZoomIntoView([baseShell, variantShell, createRoomShell]);

  figma.closePlugin(
    'Built "' +
      SCREEN_NAME +
      '", "' +
      SCREEN_NAME_VARIANT +
      '" and "' +
      CREATE_ROOM_SCREEN +
      '". Create room tab active on the last screen. Removed old base screens: ' +
      removed +
      "."
  );
}

buildChambersScreen().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
