/**
 * Locus Chamber — mobile room screens NEXT TO each source image.
 *
 * - iPhone-style frames (390 × 844)
 * - Does NOT modify existing app template screens
 * - Game-style file UI: hotspots, inventory dock, room + file tabs
 *
 * Plugins → Development → Import manifest → Run on page with image 1…5
 */

const IMAGE_IDS = ["7:17", "15:3", "15:6", "15:9", "15:12"];
const APP_PREFIX = "App — ";
const W = 390;
const H = 844;
const GAP = 32;
const STATUS_H = 44;
const NAV_H = 48;
const HUD_H = 52;
const FOOTER_H = 72;
const RADIUS = 40;

const SCREENS = [
  {
    title: "01 Opening",
    roomName: "Entry hall",
    navTitle: "Opening",
    files: ["Photos", "Notes", "Maps"],
    activeFile: 0,
    hotspots: [
      { x: 0.26, y: 0.36, w: 0.18, h: 0.16, primary: true },
      { x: 0.52, y: 0.42, w: 0.14, h: 0.12 },
      { x: 0.68, y: 0.56, w: 0.12, h: 0.1, round: true }
    ]
  },
  {
    title: "02 Memory scene",
    roomName: "Memory garden",
    navTitle: "Memory",
    files: ["Photos", "People", "Places"],
    activeFile: 0,
    hotspots: [
      { x: 0.2, y: 0.34, w: 0.2, h: 0.18, primary: true },
      { x: 0.48, y: 0.5, w: 0.15, h: 0.13 },
      { x: 0.7, y: 0.3, w: 0.12, h: 0.11, round: true }
    ]
  },
  {
    title: "03 Castle corridor",
    roomName: "Castle corridor",
    navTitle: "Corridor",
    files: ["Docs", "Keys", "Maps"],
    activeFile: 0,
    hotspots: [
      { x: 0.32, y: 0.38, w: 0.16, h: 0.2, primary: true },
      { x: 0.54, y: 0.36, w: 0.12, h: 0.14 },
      { x: 0.72, y: 0.54, w: 0.1, h: 0.1, round: true }
    ]
  },
  {
    title: "04 Living room",
    roomName: "Your room 1",
    navTitle: "Living room",
    files: ["Photos", "Docs", "Books"],
    activeFile: 0,
    showFolder: true,
    folderLabel: "Cat photos",
    hotspots: [
      { x: 0.16, y: 0.5, w: 0.14, h: 0.12, primary: true, round: true },
      { x: 0.4, y: 0.42, w: 0.15, h: 0.14 },
      { x: 0.6, y: 0.58, w: 0.14, h: 0.12 },
      { x: 0.76, y: 0.34, w: 0.11, h: 0.1, round: true }
    ]
  },
  {
    title: "05 Room detail",
    roomName: "Study nook",
    navTitle: "Study",
    files: ["Books", "Notes", "Links"],
    activeFile: 0,
    hotspots: [
      { x: 0.28, y: 0.44, w: 0.16, h: 0.15, primary: true },
      { x: 0.5, y: 0.54, w: 0.14, h: 0.12 },
      { x: 0.7, y: 0.36, w: 0.11, h: 0.1, round: true }
    ]
  }
];

function hex(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255
  };
}

function solid(color, opacity) {
  return [{ type: "SOLID", color: color, opacity: opacity == null ? 1 : opacity }];
}

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

function removePreviousAppScreens(page) {
  const nodes = page.findAll(function (node) {
    return (
      (node.type === "FRAME" && node.name.indexOf(APP_PREFIX) === 0) ||
      node.name === "→ mobile"
    );
  });
  nodes.forEach(function (node) {
    node.remove();
  });
  return nodes.length;
}

function createText(parent, opts) {
  const t = figma.createText();
  t.fontName = { family: "Inter", style: opts.weight || "Regular" };
  t.characters = opts.text;
  t.fontSize = opts.size || 11;
  t.fills = solid(hex(opts.color || "#f7f8f8"), opts.opacity);
  t.x = opts.x || 0;
  t.y = opts.y || 0;
  if (opts.name) t.name = opts.name;
  parent.appendChild(t);
  return t;
}

function createStatusBar(parent) {
  const bar = figma.createFrame();
  bar.name = "Status bar";
  bar.resize(W, STATUS_H);
  bar.fills = solid(hex("#34261c"));
  parent.appendChild(bar);

  createText(bar, {
    text: "9:41",
    size: 14,
    color: "#ede0cc",
    weight: "Semi Bold",
    x: 24,
    y: 14
  });

  const indicators = figma.createFrame();
  indicators.name = "Status icons";
  indicators.resize(56, 12);
  indicators.x = W - 72;
  indicators.y = 18;
  indicators.fills = [];
  parent.appendChild(indicators);
  bar.appendChild(indicators);

  [0, 18, 36].forEach(function (ox, i) {
    const pill = figma.createRectangle();
    pill.resize(i === 2 ? 22 : 14, 8);
    pill.x = ox;
    pill.y = 2;
    pill.cornerRadius = 2;
    pill.fills = solid(hex("#ede0cc"), i === 2 ? 0.9 : 0.45);
    indicators.appendChild(pill);
  });

  return bar;
}

function createMobileNav(parent, spec) {
  const nav = figma.createFrame();
  nav.name = "Navigation bar";
  nav.resize(W, NAV_H);
  nav.y = STATUS_H;
  nav.fills = solid(hex("#34261c"));
  nav.strokes = solid(hex("#ffffff"), 0.08);
  nav.strokeWeight = 1;
  parent.appendChild(nav);

  createText(nav, {
    text: "‹",
    size: 22,
    color: "#c4a066",
    weight: "Regular",
    x: 12,
    y: 10
  });
  createText(nav, {
    text: spec.navTitle,
    size: 15,
    color: "#ede0cc",
    weight: "Semi Bold",
    x: W / 2 - spec.navTitle.length * 4,
    y: 14
  });
  createText(nav, {
    text: "···",
    size: 16,
    color: "#c4a066",
    x: W - 36,
    y: 12
  });

  return nav;
}

function createHotspot(parent, spec, viewportW, viewportH) {
  const frame = figma.createFrame();
  frame.name = spec.primary ? "Hotspot (primary)" : "Hotspot";
  frame.resize(
    Math.max(28, viewportW * spec.w),
    Math.max(28, viewportH * spec.h)
  );
  frame.x = viewportW * spec.x;
  frame.y = viewportH * spec.y;
  frame.fills = solid(hex("#be9155"), spec.primary ? 0.22 : 0.12);
  frame.strokes = solid(hex(spec.primary ? "#e8c48c" : "#d2b278"), spec.primary ? 0.9 : 0.55);
  frame.strokeWeight = spec.primary ? 2.5 : 1.5;
  frame.cornerRadius = spec.round ? Math.min(frame.width, frame.height) / 2 : 10;
  if (spec.primary) {
    frame.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0.83, g: 0.66, b: 0.39, a: 0.4 },
        offset: { x: 0, y: 0 },
        radius: 14,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
  }
  parent.appendChild(frame);
  return frame;
}

function createInventoryDock(parent) {
  const dock = figma.createFrame();
  dock.name = "Inventory dock";
  dock.resize(W, HUD_H);
  dock.fills = solid(hex("#0e0f13"), 0.92);
  dock.strokes = solid(hex("#ffffff"), 0.08);
  dock.strokeWeight = 1;
  parent.appendChild(dock);

  const slots = ["📁", "🖼", "📄", "📚"];
  const slotSize = 40;
  const gap = (W - slots.length * slotSize) / (slots.length + 1);

  slots.forEach(function (icon, i) {
    const slot = figma.createFrame();
    slot.name = "Slot " + (i + 1);
    slot.resize(slotSize, slotSize);
    slot.x = gap + i * (slotSize + gap);
    slot.y = 6;
    slot.cornerRadius = 10;
    slot.fills = solid(hex(i === 0 ? "#7170ff" : "#ffffff"), i === 0 ? 0.16 : 0.05);
    slot.strokes = solid(hex(i === 0 ? "#7170ff" : "#ffffff"), i === 0 ? 0.45 : 0.1);
    slot.strokeWeight = 1.5;
    dock.appendChild(slot);
    createText(slot, { text: icon, size: 18, x: 10, y: 9 });
  });

  return dock;
}

function createFileChip(parent, label, active, x, y) {
  const chip = figma.createFrame();
  chip.name = "File tab — " + label;
  chip.layoutMode = "HORIZONTAL";
  chip.primaryAxisAlignItems = "CENTER";
  chip.counterAxisAlignItems = "CENTER";
  chip.itemSpacing = 4;
  chip.paddingLeft = 10;
  chip.paddingRight = 10;
  chip.paddingTop = 6;
  chip.paddingBottom = 6;
  chip.cornerRadius = 999;
  chip.fills = solid(hex(active ? "#7170ff" : "#ffffff"), active ? 0.14 : 0.05);
  chip.strokes = solid(hex(active ? "#7170ff" : "#ffffff"), active ? 0.4 : 0.1);
  chip.strokeWeight = 1;
  chip.x = x;
  chip.y = y;

  createText(chip, {
    text: label,
    size: 11,
    color: active ? "#f7f8f8" : "#8a8f98",
    weight: active ? "Semi Bold" : "Regular"
  });

  parent.appendChild(chip);
  return chip;
}

function createFolderSheet(parent, label) {
  const panel = figma.createFrame();
  panel.name = "Folder sheet";
  panel.resize(W - 32, 148);
  panel.x = 16;
  panel.y = 24;
  panel.cornerRadius = 16;
  panel.fills = solid(hex("#1a1510"));
  panel.strokes = solid(hex("#b48c58"), 0.45);
  panel.strokeWeight = 1;
  panel.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.5 },
      offset: { x: 0, y: 10 },
      radius: 28,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  parent.appendChild(panel);

  const bar = figma.createFrame();
  bar.name = "Sheet handle";
  bar.resize(W - 32, 36);
  bar.fills = solid(hex("#2f2219"));
  bar.cornerRadius = 16;
  panel.appendChild(bar);

  const handle = figma.createRectangle();
  handle.resize(36, 4);
  handle.x = (W - 32) / 2 - 18;
  handle.y = 8;
  handle.cornerRadius = 2;
  handle.fills = solid(hex("#b48c58"), 0.45);
  bar.appendChild(handle);

  createText(bar, { text: "📁  " + label, size: 12, color: "#ede0cc", weight: "Semi Bold", x: 16, y: 16 });

  for (let i = 0; i < 4; i++) {
    const thumb = figma.createFrame();
    thumb.name = "Thumb " + (i + 1);
    thumb.resize(56, 56);
    thumb.x = 16 + i * 64;
    thumb.y = 48;
    thumb.cornerRadius = 10;
    thumb.fills = solid(hex("#120e0b"));
    thumb.strokes = solid(hex("#b48c58"), 0.22);
    thumb.strokeWeight = 1;
    panel.appendChild(thumb);
  }

  return panel;
}

function buildAppScreen(parent, src, spec) {
  const topOffset = STATUS_H + NAV_H;
  const viewportH = H - topOffset - HUD_H - FOOTER_H;

  const shell = figma.createFrame();
  shell.name = APP_PREFIX + spec.title + " (mobile)";
  shell.resize(W, H);
  shell.x = src.x + src.width + GAP;
  shell.y = src.y + Math.max(0, (src.height - H) / 2);
  shell.cornerRadius = RADIUS;
  shell.clipsContent = true;
  shell.fills = solid(hex("#08090a"));
  shell.strokes = solid(hex("#7170ff"), 0.28);
  shell.strokeWeight = 2;
  parent.appendChild(shell);

  createStatusBar(shell);
  createMobileNav(shell, spec);

  const viewport = figma.createFrame();
  viewport.name = "Room viewport";
  viewport.resize(W, viewportH);
  viewport.y = topOffset;
  viewport.clipsContent = true;
  viewport.fills = solid(hex("#120e0b"));
  shell.appendChild(viewport);

  const art = src.clone();
  viewport.appendChild(art);
  const scale = Math.max(viewport.width / art.width, viewport.height / art.height);
  art.resize(art.width * scale, art.height * scale);
  art.x = (viewport.width - art.width) / 2;
  art.y = (viewport.height - art.height) / 2;

  const overlay = figma.createFrame();
  overlay.name = "Hotspots overlay";
  overlay.resize(W, viewportH);
  overlay.fills = [];
  viewport.appendChild(overlay);

  spec.hotspots.forEach(function (spot) {
    createHotspot(overlay, spot, W, viewportH);
  });

  if (spec.showFolder) {
    createFolderSheet(overlay, spec.folderLabel || "Folder");
  }

  const hud = createInventoryDock(shell);
  hud.y = topOffset + viewportH;

  const footer = figma.createFrame();
  footer.name = "Room footer";
  footer.resize(W, FOOTER_H);
  footer.y = H - FOOTER_H;
  footer.fills = solid(hex("#121318"));
  footer.strokes = solid(hex("#ffffff"), 0.08);
  footer.strokeWeight = 1;
  shell.appendChild(footer);

  createText(footer, {
    text: "ROOM · " + spec.roomName,
    size: 11,
    color: "#8a8f98",
    weight: "Medium",
    x: 16,
    y: 10
  });

  let chipX = 16;
  spec.files.forEach(function (label, index) {
    const chip = createFileChip(footer, label, index === spec.activeFile, chipX, 34);
    chipX += chip.width + 8;
  });

  const homeIndicator = figma.createRectangle();
  homeIndicator.name = "Home indicator";
  homeIndicator.resize(120, 4);
  homeIndicator.x = (W - 120) / 2;
  homeIndicator.y = H - 10;
  homeIndicator.cornerRadius = 2;
  homeIndicator.fills = solid(hex("#ffffff"), 0.28);
  shell.appendChild(homeIndicator);

  const connector = figma.createText();
  connector.name = "→ mobile";
  connector.fontName = { family: "Inter", style: "Medium" };
  connector.characters = "→ mobile";
  connector.fontSize = 11;
  connector.fills = solid(hex("#7170ff"), 0.75);
  connector.x = src.x + src.width + 6;
  connector.y = src.y + src.height / 2 - 6;
  parent.appendChild(connector);

  return shell;
}

async function buildScreens() {
  await loadFonts();

  const page = figma.currentPage;
  const removed = removePreviousAppScreens(page);
  let built = 0;
  const created = [];

  for (let i = 0; i < SCREENS.length; i++) {
    const spec = SCREENS[i];
    const src = await figma.getNodeByIdAsync(IMAGE_IDS[i]);
    if (!src || !("clone" in src) || !src.parent) continue;
    if (
      src.parent.type === "PAGE" ||
      src.parent.type === "FRAME" ||
      src.parent.type === "SECTION"
    ) {
      created.push(buildAppScreen(src.parent, src, spec));
      built += 1;
    }
  }

  if (created.length) {
    figma.viewport.scrollAndZoomIntoView(created);
  }

  figma.closePlugin(
    "Built " +
      built +
      " mobile screens (390×844) next to source images. Removed " +
      removed +
      " old frames. Template untouched."
  );
}

buildScreens().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
