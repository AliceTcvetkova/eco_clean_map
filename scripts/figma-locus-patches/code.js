/**
 * Locus Chamber — surgical patches (does not rebuild full screens).
 * Preserves frame positions; only updates targeted layers.
 */

const CREATE_ROOM_2_SHELL = "Create room - 2";
const HIGHLIGHT_ROOM_TYPE = "living room";

const LR_BASE = "App — Living Room (mobile)";
const LR_TAP = "App — Living Room — Tap (mobile)";
const LR_AREA = "App — Living Room — Area (mobile)";
const LR_FILE_TYPE = "App — Living Room — File type (mobile)";
const LR_UPLOAD = "App — Living Room — Upload (mobile)";
const MEMORY_GARDEN_ADD_FILE_SHELL = "App — Memory Garden — Add file (mobile)";
const PHOTO_FRAME_ICON_NAME = "photo_2026-06-13_19-20-00 (2) 1";

const CALLOUT_NAME = "Area create callout";
const TAP_EFFECT_NAME = "Tap effect";
const DIM_OVERLAY_NAME = "Screen dim overlay";
const AREA_EDITOR_NAME = "Area hotspot editor";
const FILE_TYPE_POPUP_NAME = "File type popup";

const W = 390;
const H = 844;
const STATUS_H = 44;
const NAV_H = 48;
const SCREEN_GAP = 32;

const THEME = {
  text: "#f8e6c8",
  muted: "#bba987",
  accent: "#f1bd77",
  line: "#d7a663",
  surface: "#0f1824",
  ink: "#02060d"
};

const FILE_TYPE_LABELS = ["docs", "photos", "ideas", "folders"];
const FILE_TYPE_FALLBACK = [
  { name: FILE_TYPE_LABELS[0], kind: "book" },
  { name: FILE_TYPE_LABELS[1], kind: "candle" },
  { name: FILE_TYPE_LABELS[2], kind: "frame" },
  { name: FILE_TYPE_LABELS[3], kind: "vase" }
];

function getImageHash(node) {
  if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
  const fill = node.fills.find(function (f) {
    return f.type === "IMAGE" && f.visible !== false && f.imageHash;
  });
  return fill ? fill.imageHash : null;
}

function extractDockIconHashes(shell) {
  const dock = shell.findOne(function (node) {
    return node.type === "FRAME" && node.name === "Hotspot dock";
  });
  if (!dock) return [];

  const slots = dock.children.filter(function (node) {
    return node.type === "FRAME" && node.name.indexOf("Hotspot icon slot") === 0;
  });

  slots.sort(function (a, b) {
    const ai = parseInt(a.name.replace(/\D+/g, ""), 10) || 0;
    const bi = parseInt(b.name.replace(/\D+/g, ""), 10) || 0;
    return ai - bi;
  });

  return slots
    .map(function (slot) {
      const preview = slot.findOne(function (node) {
        return node.name === "Area preview";
      });
      return preview ? getImageHash(preview) : getImageHash(slot);
    })
    .filter(Boolean);
}

function findPhotoFrameIconHash(page) {
  const target = normalizeName(PHOTO_FRAME_ICON_NAME);
  const nodes = page.findAll(function (node) {
    return normalizeName(node.name) === target;
  });

  for (let i = 0; i < nodes.length; i++) {
    const direct = getImageHash(nodes[i]);
    if (direct) return direct;

    const nested = nodes[i].findAll(function (node) {
      return !!getImageHash(node);
    });
    if (nested.length) return getImageHash(nested[0]);
  }

  return null;
}

function resolveFileTypeIcons(page) {
  const icons = [];
  const mgShell = findShell(page, MEMORY_GARDEN_ADD_FILE_SHELL);
  const dockHashes = mgShell ? extractDockIconHashes(mgShell) : [];

  for (let i = 0; i < 3; i++) {
    if (dockHashes[i]) {
      icons.push({ name: FILE_TYPE_LABELS[i], imageHash: dockHashes[i] });
    } else if (FILE_TYPE_FALLBACK[i]) {
      icons.push(FILE_TYPE_FALLBACK[i]);
    }
  }

  const photoHash = findPhotoFrameIconHash(page);
  if (photoHash) {
    icons.push({
      name: FILE_TYPE_LABELS[3],
      imageHash: photoHash,
      imageNodeName: PHOTO_FRAME_ICON_NAME
    });
  } else if (FILE_TYPE_FALLBACK[3]) {
    icons.push(FILE_TYPE_FALLBACK[3]);
  }

  return icons.slice(0, 4);
}

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

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

function findShell(page, shellName) {
  const target = normalizeName(shellName);
  const matches = page.findAll(function (node) {
    return node.type === "FRAME" && normalizeName(node.name) === target;
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.width * b.height - a.width * a.height;
  });
  return matches[0];
}

function findViewport(shell) {
  return shell.findOne(function (node) {
    return node.type === "FRAME" && node.name === "Room viewport";
  });
}

function getViewportBox(shell) {
  const vp = findViewport(shell);
  if (!vp) {
    return { x: 0, y: STATUS_H + NAV_H, w: shell.width, h: shell.height - STATUS_H - NAV_H - 24 };
  }
  return { x: vp.x, y: vp.y, w: vp.width, h: vp.height };
}

function removeNodesByName(root, name) {
  let removed = 0;
  root.findAll(function (node) {
    return node.name === name;
  }).forEach(function (node) {
    node.remove();
    removed++;
  });
  return removed;
}

function removeLivingRoomPatchLayers(shell, names) {
  names.forEach(function (name) {
    removeNodesByName(shell, name);
  });
  removeNodesByName(shell, "Hotspot dock");
}

function ensureVariantShell(page, anchor, shellName) {
  const existing = findShell(page, shellName);
  if (existing) return { shell: existing, created: false };

  const clone = anchor.clone();
  clone.name = shellName;
  clone.x = anchor.x + anchor.width + SCREEN_GAP;
  clone.y = anchor.y;
  page.appendChild(clone);
  return { shell: clone, created: true };
}

function makeText(parent, opts) {
  const node = figma.createText();
  node.name = opts.name || "Label";
  node.fontName = { family: "Inter", style: opts.weight || "Regular" };
  node.characters = opts.text;
  node.fontSize = opts.size || 14;
  node.lineHeight = { unit: "PIXELS", value: opts.lineHeight || Math.round((opts.size || 14) * 1.35) };
  node.fills = solid(opts.color || THEME.text, opts.opacity == null ? 1 : opts.opacity);
  if (opts.align) node.textAlignHorizontal = opts.align;
  node.textAutoResize = opts.autoResize || "WIDTH_AND_HEIGHT";
  if (opts.width) node.resize(opts.width, node.height);
  node.x = opts.x || 0;
  node.y = opts.y || 0;
  parent.appendChild(node);
  return node;
}

function findRoomTypeRows(shell) {
  return shell.findAll(function (node) {
    return node.type === "FRAME" && node.name.indexOf("Room type —") === 0;
  });
}

function resetCreateRoomHighlights(shell) {
  findRoomTypeRows(shell).forEach(function (row) {
    row.opacity = 1;
    row.fills = [];
    row.strokes = [];
    row.strokeWeight = 0;
    row.effects = [];
    row.findAll(function (node) {
      return node.type === "TEXT" && node.name === "Room type label";
    }).forEach(function (label) {
      label.fills = solid(THEME.text, 0.96);
      label.fontName = { family: "Inter", style: "Regular" };
    });
  });
}

function highlightLivingRoomOnCreateRoom2(shell) {
  resetCreateRoomHighlights(shell);
  const target = normalizeName(HIGHLIGHT_ROOM_TYPE);
  let matched = false;

  findRoomTypeRows(shell).forEach(function (row) {
    const rowLabel = row.name.replace(/^Room type —\s*/i, "");
    if (normalizeName(rowLabel) !== target) {
      row.opacity = 0.42;
      return;
    }
    matched = true;
    row.fills = solid(THEME.accent, 0.14);
    row.strokes = solid(THEME.line, 0.72);
    row.strokeWeight = 1.5;
    row.cornerRadius = 10;
    row.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.91, b: 0.72, a: 0.28 },
        offset: { x: 0, y: 0 },
        radius: 10,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
    row.findAll(function (node) {
      return node.type === "TEXT" && node.name === "Room type label";
    }).forEach(function (label) {
      label.fills = solid(THEME.accent, 1);
      label.fontName = { family: "Inter", style: "Semi Bold" };
    });
  });

  return matched;
}

function addAreaCreateCallout(shell, y) {
  removeNodesByName(shell, CALLOUT_NAME);

  const w = shell.width;
  const calloutW = 272;
  const calloutH = 52;
  const calloutY = y == null ? shell.height - calloutH - 88 : y;

  const callout = figma.createFrame();
  callout.name = CALLOUT_NAME;
  callout.resize(calloutW, calloutH);
  callout.x = (w - calloutW) / 2;
  callout.y = calloutY;
  callout.cornerRadius = 16;
  callout.fills = solid(THEME.surface, 0.94);
  callout.strokes = solid(THEME.line, 0.62);
  callout.strokeWeight = 1.5;
  callout.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.36 },
      offset: { x: 0, y: 8 },
      radius: 22,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  shell.appendChild(callout);

  const label = makeText(callout, {
    name: "Callout label",
    text: "Tap to create an area",
    size: 15,
    weight: "Semi Bold",
    color: THEME.text,
    lineHeight: 20
  });
  label.x = (calloutW - label.width) / 2;
  label.y = (calloutH - label.height) / 2;
  return callout;
}

function patchLivingRoomCalloutBottom(shell) {
  removeLivingRoomPatchLayers(shell, [
    TAP_EFFECT_NAME,
    DIM_OVERLAY_NAME,
    AREA_EDITOR_NAME,
    FILE_TYPE_POPUP_NAME,
    "File picker overlay"
  ]);
  addAreaCreateCallout(shell);
}

function addTapEffect(shell) {
  removeNodesByName(shell, TAP_EFFECT_NAME);
  const box = getViewportBox(shell);
  const cx = box.x + box.w * 0.46;
  const cy = box.y + box.h * 0.48;

  const wrap = figma.createFrame();
  wrap.name = TAP_EFFECT_NAME;
  wrap.resize(box.w, box.h);
  wrap.x = box.x;
  wrap.y = box.y;
  wrap.fills = [];
  shell.appendChild(wrap);

  function addRing(size, opacity, blur) {
    const ring = figma.createEllipse();
    ring.name = "Tap ripple";
    ring.resize(size, size);
    ring.x = cx - size / 2;
    ring.y = cy - size / 2;
    ring.fills = solid(THEME.accent, opacity);
    ring.strokes = solid(THEME.line, opacity + 0.12);
    ring.strokeWeight = 1.5;
    if (blur) {
      ring.effects = [{ type: "LAYER_BLUR", radius: blur, visible: true }];
    }
    wrap.appendChild(ring);
  }

  addRing(132, 0.06, 18);
  addRing(96, 0.1, 12);
  addRing(64, 0.14, 6);

  const dot = figma.createEllipse();
  dot.name = "Tap center";
  dot.resize(14, 14);
  dot.x = cx - 7;
  dot.y = cy - 7;
  dot.fills = solid(THEME.accent, 0.95);
  dot.strokes = solid("#ffe9b8", 1);
  dot.strokeWeight = 2;
  dot.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 1, g: 0.91, b: 0.72, a: 0.65 },
      offset: { x: 0, y: 0 },
      radius: 10,
      spread: 1,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  wrap.appendChild(dot);

  return wrap;
}

function patchLivingRoomTap(shell) {
  removeLivingRoomPatchLayers(shell, [
    CALLOUT_NAME,
    DIM_OVERLAY_NAME,
    AREA_EDITOR_NAME,
    FILE_TYPE_POPUP_NAME,
    "File picker overlay"
  ]);
  addScreenDimOverlay(shell, 0.48);
  addTapEffect(shell);
}

function addScreenDimOverlay(shell, opacity) {
  removeNodesByName(shell, DIM_OVERLAY_NAME);
  const box = getViewportBox(shell);
  const dim = figma.createRectangle();
  dim.name = DIM_OVERLAY_NAME;
  dim.resize(box.w, box.h);
  dim.x = box.x;
  dim.y = box.y;
  dim.fills = solid("#000000", opacity == null ? 0.58 : opacity);
  shell.appendChild(dim);
  return dim;
}

function addResizeHandle(parent, x, y, name) {
  const handle = figma.createRectangle();
  handle.name = name;
  handle.resize(10, 10);
  handle.x = x - 5;
  handle.y = y - 5;
  handle.cornerRadius = 2;
  handle.fills = solid("#fff4dc", 1);
  handle.strokes = solid(THEME.line, 0.95);
  handle.strokeWeight = 1.5;
  parent.appendChild(handle);
  return handle;
}

function addAreaHotspotEditor(shell, withHandles) {
  removeNodesByName(shell, AREA_EDITOR_NAME);
  const box = getViewportBox(shell);
  const rectW = Math.round(box.w * 0.38);
  const rectH = Math.round(box.h * 0.24);
  const rectX = box.x + box.w * 0.3;
  const rectY = box.y + box.h * 0.4;

  const editor = figma.createFrame();
  editor.name = AREA_EDITOR_NAME;
  editor.resize(rectW, rectH);
  editor.x = rectX;
  editor.y = rectY;
  editor.fills = solid(THEME.accent, 0.18);
  editor.strokes = solid("#ffe9b8", 0.98);
  editor.strokeWeight = 2.5;
  editor.cornerRadius = 14;
  editor.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 1, g: 0.91, b: 0.72, a: 0.42 },
      offset: { x: 0, y: 0 },
      radius: 16,
      spread: 1,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  shell.appendChild(editor);

  if (withHandles !== false) {
    addResizeHandle(editor, 0, 0, "Resize handle NW");
    addResizeHandle(editor, rectW, 0, "Resize handle NE");
    addResizeHandle(editor, 0, rectH, "Resize handle SW");
    addResizeHandle(editor, rectW, rectH, "Resize handle SE");
    addResizeHandle(editor, rectW / 2, 0, "Resize handle N");
    addResizeHandle(editor, rectW / 2, rectH, "Resize handle S");
    addResizeHandle(editor, 0, rectH / 2, "Resize handle W");
    addResizeHandle(editor, rectW, rectH / 2, "Resize handle E");
  }

  return editor;
}

function patchLivingRoomArea(shell) {
  removeLivingRoomPatchLayers(shell, [
    CALLOUT_NAME,
    TAP_EFFECT_NAME,
    FILE_TYPE_POPUP_NAME,
    "File picker overlay"
  ]);
  addScreenDimOverlay(shell);
  addAreaHotspotEditor(shell);
}

function drawBookIcon(parent) {
  const cover = figma.createRectangle();
  cover.name = "Icon art";
  cover.resize(14, 18);
  cover.x = 13;
  cover.y = 11;
  cover.cornerRadius = 2;
  cover.fills = solid(THEME.line, 0.9);
  parent.appendChild(cover);
  const page = figma.createRectangle();
  page.resize(10, 14);
  page.x = 16;
  page.y = 13;
  page.cornerRadius = 1;
  page.fills = solid(THEME.text, 0.92);
  parent.appendChild(page);
}

function drawCandleIcon(parent) {
  const wax = figma.createRectangle();
  wax.name = "Icon art";
  wax.resize(8, 16);
  wax.x = 16;
  wax.y = 16;
  wax.cornerRadius = 2;
  wax.fills = solid("#f8e6c8", 0.92);
  parent.appendChild(wax);
  const flame = figma.createEllipse();
  flame.resize(10, 12);
  flame.x = 15;
  flame.y = 6;
  flame.fills = solid(THEME.accent, 0.95);
  parent.appendChild(flame);
}

function drawFrameIcon(parent) {
  const outer = figma.createRectangle();
  outer.name = "Icon art";
  outer.resize(20, 20);
  outer.x = 10;
  outer.y = 12;
  outer.cornerRadius = 3;
  outer.fills = solid(THEME.line, 0.85);
  parent.appendChild(outer);
  const inner = figma.createRectangle();
  inner.resize(12, 12);
  inner.x = 14;
  inner.y = 16;
  inner.fills = solid(THEME.ink, 0.55);
  parent.appendChild(inner);
}

function drawVaseIcon(parent) {
  const vase = figma.createRectangle();
  vase.name = "Icon art";
  vase.resize(14, 12);
  vase.x = 13;
  vase.y = 20;
  vase.cornerRadius = 2;
  vase.fills = solid("#8eb8d8", 0.75);
  parent.appendChild(vase);
  const flower = figma.createEllipse();
  flower.resize(8, 8);
  flower.x = 10;
  flower.y = 10;
  flower.fills = solid("#f2a6c4", 1);
  parent.appendChild(flower);
  const flower2 = figma.createEllipse();
  flower2.resize(7, 7);
  flower2.x = 18;
  flower2.y = 11;
  flower2.fills = solid("#e995b8", 1);
  parent.appendChild(flower2);
}

function addFileTypeIcon(parent, spec, x) {
  const slot = figma.createFrame();
  slot.name = "File type — " + spec.name;
  slot.resize(56, 56);
  slot.x = x;
  slot.y = 58;
  slot.cornerRadius = 28;
  slot.clipsContent = true;
  slot.fills = solid(THEME.ink, 0.42);
  slot.strokes = solid(THEME.line, 0.45);
  slot.strokeWeight = 1;
  parent.appendChild(slot);

  if (spec.imageHash) {
    const img = figma.createRectangle();
    img.name = spec.imageNodeName || "File type image";
    img.resize(56, 56);
    img.fills = [{ type: "IMAGE", imageHash: spec.imageHash, scaleMode: "FILL" }];
    slot.appendChild(img);
  } else if (spec.kind === "book") drawBookIcon(slot);
  else if (spec.kind === "candle") drawCandleIcon(slot);
  else if (spec.kind === "frame") drawFrameIcon(slot);
  else drawVaseIcon(slot);

  const caption = makeText(parent, {
    name: "File type label",
    text: spec.name,
    size: 9,
    color: THEME.muted,
    x: x + 2,
    y: 118,
    width: 52,
    align: "CENTER",
    autoResize: "HEIGHT"
  });
  caption.textAlignHorizontal = "CENTER";
  return slot;
}

function addFileTypePopup(shell, page) {
  removeNodesByName(shell, FILE_TYPE_POPUP_NAME);
  const icons = resolveFileTypeIcons(page);
  const popupW = W - 32;
  const popupH = 168;
  const popup = figma.createFrame();
  popup.name = FILE_TYPE_POPUP_NAME;
  popup.resize(popupW, popupH);
  popup.x = 16;
  popup.y = shell.height - popupH - 96;
  popup.cornerRadius = 18;
  popup.fills = solid(THEME.surface, 0.96);
  popup.strokes = solid(THEME.line, 0.58);
  popup.strokeWeight = 1.5;
  popup.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.38 },
      offset: { x: 0, y: 10 },
      radius: 24,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  shell.appendChild(popup);

  makeText(popup, {
    name: "Popup title",
    text: "Choose file type",
    size: 14,
    weight: "Semi Bold",
    color: THEME.text,
    x: 16,
    y: 16
  });

  const gap = (popupW - icons.length * 56) / (icons.length + 1);
  icons.forEach(function (spec, i) {
    addFileTypeIcon(popup, spec, gap + i * (56 + gap));
  });

  return { popup: popup, icons: icons };
}

function patchLivingRoomFileType(shell, page) {
  removeLivingRoomPatchLayers(shell, [CALLOUT_NAME, TAP_EFFECT_NAME, "File picker overlay"]);
  addScreenDimOverlay(shell);
  addAreaHotspotEditor(shell, false);
  return addFileTypePopup(shell, page);
}

function patchLivingRoomFileTypeNote(page, result) {
  const icons = result && result.icons ? result.icons : [];
  const imageCount = icons.filter(function (icon) {
    return !!icon.imageHash;
  }).length;
  let note = LR_FILE_TYPE + ": file type popup";
  note += " (" + imageCount + "/4 image icons";
  if (imageCount < 4) note += ", check Memory Garden Add file + " + PHOTO_FRAME_ICON_NAME;
  note += ")";
  return note;
}

function createPickerRow(parent, opts) {
  const row = figma.createFrame();
  row.name = opts.name || "Picker row";
  row.resize(parent.width, opts.height || 48);
  row.x = 0;
  row.y = opts.y || 0;
  row.fills = [];
  parent.appendChild(row);

  if (opts.iconColor) {
    const icon = figma.createFrame();
    icon.name = "Row icon";
    icon.resize(28, 28);
    icon.x = 16;
    icon.y = (row.height - 28) / 2;
    icon.cornerRadius = 6;
    icon.fills = solid(opts.iconColor, 0.9);
    row.appendChild(icon);
  }

  makeText(row, {
    name: "Row label",
    text: opts.label,
    size: 17,
    color: opts.textColor || "#000000",
    x: opts.iconColor ? 56 : 16,
    y: (row.height - 17) / 2
  });

  if (opts.chevron) {
    makeText(row, {
      name: "Chevron",
      text: "›",
      size: 20,
      color: "#c7c7cc",
      x: row.width - 28,
      y: (row.height - 20) / 2
    });
  }

  if (opts.divider) {
    const divider = figma.createRectangle();
    divider.name = "Divider";
    divider.resize(row.width - (opts.iconColor ? 56 : 16), 1);
    divider.x = opts.iconColor ? 56 : 16;
    divider.y = row.height - 1;
    divider.fills = solid("#c6c6c8", 1);
    row.appendChild(divider);
  }

  return row;
}

function createPhoneFilePicker(parent) {
  removeNodesByName(parent, "File picker overlay");

  const overlay = figma.createFrame();
  overlay.name = "File picker overlay";
  overlay.resize(W, H);
  overlay.x = 0;
  overlay.y = 0;
  overlay.fills = solid("#000000", 0.38);
  parent.appendChild(overlay);

  const sheet = figma.createFrame();
  sheet.name = "File picker sheet";
  sheet.resize(W, H - STATUS_H);
  sheet.x = 0;
  sheet.y = STATUS_H;
  sheet.fills = solid("#f2f2f7", 1);
  overlay.appendChild(sheet);

  const navBar = figma.createFrame();
  navBar.name = "Picker navigation";
  navBar.resize(W, 52);
  navBar.fills = solid("#f2f2f7", 1);
  sheet.appendChild(navBar);

  makeText(navBar, { name: "Cancel", text: "Cancel", size: 17, color: "#007aff", x: 16, y: 16 });
  makeText(navBar, {
    name: "Title",
    text: "Browse",
    size: 17,
    weight: "Semi Bold",
    color: "#000000",
    x: W / 2 - 34,
    y: 16
  });

  const search = figma.createFrame();
  search.name = "Search bar";
  search.resize(W - 32, 36);
  search.x = 16;
  search.y = 56;
  search.cornerRadius = 10;
  search.fills = solid("#e3e3e8", 1);
  sheet.appendChild(search);
  makeText(search, {
    name: "Search placeholder",
    text: "Search",
    size: 16,
    color: "#8e8e93",
    x: 12,
    y: 9
  });

  const locationsCard = figma.createFrame();
  locationsCard.name = "Locations";
  locationsCard.resize(W - 32, 148);
  locationsCard.x = 16;
  locationsCard.y = 108;
  locationsCard.cornerRadius = 12;
  locationsCard.fills = solid("#ffffff", 1);
  locationsCard.clipsContent = true;
  sheet.appendChild(locationsCard);

  createPickerRow(locationsCard, {
    name: "Location iCloud",
    y: 0,
    label: "iCloud Drive",
    iconColor: "#007aff",
    chevron: true,
    divider: true
  });
  createPickerRow(locationsCard, {
    name: "Location On My iPhone",
    y: 48,
    label: "On My iPhone",
    iconColor: "#8e8e93",
    chevron: true,
    divider: true
  });
  createPickerRow(locationsCard, {
    name: "Location Recents",
    y: 96,
    label: "Recents",
    iconColor: "#ff9500",
    chevron: true
  });

  makeText(sheet, {
    name: "Recents section",
    text: "RECENTS",
    size: 12,
    weight: "Medium",
    color: "#8e8e93",
    x: 32,
    y: 272
  });

  const recentsCard = figma.createFrame();
  recentsCard.name = "Recent files";
  recentsCard.resize(W - 32, 196);
  recentsCard.x = 16;
  recentsCard.y = 296;
  recentsCard.cornerRadius = 12;
  recentsCard.fills = solid("#ffffff", 1);
  recentsCard.clipsContent = true;
  sheet.appendChild(recentsCard);

  [
    { label: "Living room photo.jpg", color: "#ff9500" },
    { label: "Memory note.pdf", color: "#ff3b30" },
    { label: "Scan.pdf", color: "#007aff" },
    { label: "Downloads", color: "#8e8e93" }
  ].forEach(function (item, i) {
    createPickerRow(recentsCard, {
      name: "Recent " + (i + 1),
      y: i * 48,
      label: item.label,
      iconColor: item.color,
      chevron: true,
      divider: i < 3
    });
  });

  const homeIndicator = figma.createRectangle();
  homeIndicator.name = "Picker home indicator";
  homeIndicator.resize(134, 5);
  homeIndicator.x = (W - 134) / 2;
  homeIndicator.y = sheet.height - 12;
  homeIndicator.cornerRadius = 3;
  homeIndicator.fills = solid("#000000", 0.22);
  sheet.appendChild(homeIndicator);

  return overlay;
}

function patchLivingRoomUpload(shell, page) {
  removeLivingRoomPatchLayers(shell, [CALLOUT_NAME, TAP_EFFECT_NAME]);
  addScreenDimOverlay(shell);
  addAreaHotspotEditor(shell);
  addFileTypePopup(shell, page);
  createPhoneFilePicker(shell);
}

function buildLivingRoomFlow(page) {
  const notes = [];
  const shells = [];

  const base = findShell(page, LR_BASE);
  if (!base) {
    notes.push('"' + LR_BASE + '" not found');
    return { notes: notes, shells: shells };
  }

  patchLivingRoomCalloutBottom(base);
  notes.push(LR_BASE + ': callout at bottom');
  shells.push(base);

  const tapResult = ensureVariantShell(page, base, LR_TAP);
  patchLivingRoomTap(tapResult.shell);
  notes.push(LR_TAP + (tapResult.created ? ": created" : ": updated") + ", tap ripple");
  shells.push(tapResult.shell);

  const areaResult = ensureVariantShell(page, tapResult.shell, LR_AREA);
  patchLivingRoomArea(areaResult.shell);
  notes.push(LR_AREA + (areaResult.created ? ": created" : ": updated") + ", area editor");
  shells.push(areaResult.shell);

  const fileResult = ensureVariantShell(page, areaResult.shell, LR_FILE_TYPE);
  const filePopup = patchLivingRoomFileType(fileResult.shell, page);
  notes.push(
    LR_FILE_TYPE +
      (fileResult.created ? ": created" : ": updated") +
      ", " +
      patchLivingRoomFileTypeNote(page, filePopup)
  );
  shells.push(fileResult.shell);

  const uploadResult = ensureVariantShell(page, fileResult.shell, LR_UPLOAD);
  patchLivingRoomUpload(uploadResult.shell, page);
  notes.push(LR_UPLOAD + (uploadResult.created ? ": created" : ": updated") + ", system file picker");
  shells.push(uploadResult.shell);

  return { notes: notes, shells: shells };
}

async function run() {
  await loadFonts();
  const page = figma.currentPage;
  const notes = [];
  const zoomTargets = [];

  const createRoom2 = findShell(page, CREATE_ROOM_2_SHELL);
  if (!createRoom2) {
    notes.push('"' + CREATE_ROOM_2_SHELL + '" not found');
  } else if (highlightLivingRoomOnCreateRoom2(createRoom2)) {
    notes.push(CREATE_ROOM_2_SHELL + ": living room highlighted");
    zoomTargets.push(createRoom2);
  } else {
    notes.push(CREATE_ROOM_2_SHELL + ': row "' + HIGHLIGHT_ROOM_TYPE + '" not found');
  }

  const flow = buildLivingRoomFlow(page);
  notes.push.apply(notes, flow.notes);
  zoomTargets.push.apply(zoomTargets, flow.shells);

  if (zoomTargets.length) {
    figma.viewport.scrollAndZoomIntoView(zoomTargets);
  }

  figma.closePlugin(notes.join(". ") + ".");
}

run().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
