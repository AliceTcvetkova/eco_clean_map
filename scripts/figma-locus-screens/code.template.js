/**
 * Locus Chamber — update room screens in place (do not move positions).
 *
 * Mapping:
 *   Opening        -> Library
 *   Memory scene   -> Shop
 *   Castle corridor-> Memory Garden
 *   Living room    -> Desk
 *   Room detail    -> Living Room
 *
 * Run on the page with mobile room frames.
 * Updates in-frame backgrounds and hotspot dock.
 * Run: node embed-room-sources.js before using in Figma.
 */

/*MEMORY_GARDEN_BEGIN*/
const MEMORY_GARDEN_BASE64 = "";
/*MEMORY_GARDEN_END*/

const MEMORY_GARDEN_FILES_SHELL = "App — Memory Garden — Files (mobile)";
const MEMORY_GARDEN_PICKER_SHELL = "App — Memory Garden — Add file (mobile)";
const MEMORY_GARDEN_PHONE_PICKER_SHELL = "App — Memory Garden — Phone picker (mobile)";
const MEMORY_GARDEN_FILES = [
  "When to plant annuals?",
  "Which plants should not be planted next to each other?",
  "A flowerbed that blooms for 7 months"
];
const SCREEN_GAP = 32;
const APP_PREFIX = "App — ";
const W = 390;
const H = 844;
const STATUS_H = 44;
const NAV_H = 48;
const HOTSPOT_DOCK_H = 68;
const HOME_INDICATOR_H = 14;
const RADIUS = 40;

const HOTSPOT_ICON_NAMES = [
  "photo_2026-06-13_19-19-59 1",
  "photo_2026-06-13_19-19-59 (2) 1",
  "photo_2026-06-13_19-20-00 (3) 1"
];

/*HOTSPOT_ICON_SOURCES_BEGIN*/
const HOTSPOT_ICON_SOURCES = [];
/*HOTSPOT_ICON_SOURCES_END*/

/*ROOM_SOURCES_BEGIN*/
const ROOM_SOURCES = [];
/*ROOM_SOURCES_END*/

const SCREENS = [
  {
    title: "Library",
    navTitle: "Library",
    shellNames: ["App — Library (mobile)", "App — 01 Opening (mobile)"],
    legacyNames: ["01 Opening", "Opening", "Entry hall"],
    hotspots: [
      { x: 0.26, y: 0.36, w: 0.18, h: 0.16, primary: true },
      { x: 0.52, y: 0.42, w: 0.14, h: 0.12 },
      { x: 0.68, y: 0.56, w: 0.12, h: 0.1, round: true }
    ]
  },
  {
    title: "Shop",
    navTitle: "Shop",
    shellNames: ["App — Shop (mobile)", "App — 02 Memory scene (mobile)"],
    legacyNames: ["02 Memory scene", "Memory scene", "Memory"],
    hotspots: [
      { x: 0.2, y: 0.34, w: 0.2, h: 0.18, primary: true },
      { x: 0.48, y: 0.5, w: 0.15, h: 0.13 },
      { x: 0.7, y: 0.3, w: 0.12, h: 0.11, round: true }
    ]
  },
  {
    title: "Memory Garden",
    navTitle: "Memory Garden",
    shellNames: [
      "App — Memory Garden (mobile)",
      "App — 03 Castle corridor (mobile)"
    ],
    legacyNames: ["03 Castle corridor", "Castle corridor", "Corridor"],
    embeddedImage: true,
    hotspotStyle: "glow",
    hotspots: [
      { x: 0.1, y: 0.57, w: 0.24, h: 0.16, primary: true },
      { x: 0.36, y: 0.45, w: 0.26, h: 0.2 },
      { x: 0.62, y: 0.55, w: 0.24, h: 0.16 }
    ]
  },
  {
    title: "Desk",
    navTitle: "Desk",
    shellNames: ["App — Desk (mobile)", "App — 04 Living room (mobile)"],
    legacyNames: ["04 Living room", "04 living room", "Your room 1"],
    hotspots: [
      { x: 0.16, y: 0.5, w: 0.14, h: 0.12, primary: true, round: true },
      { x: 0.4, y: 0.42, w: 0.15, h: 0.14 },
      { x: 0.6, y: 0.58, w: 0.14, h: 0.12 }
    ]
  },
  {
    title: "Living Room",
    navTitle: "Living Room",
    shellNames: ["App — Living Room (mobile)", "App — 05 Room detail (mobile)"],
    legacyNames: ["05 Room detail", "Room detail", "Study", "Study Nook"],
    showHotspots: false,
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

function findNodeByNames(root, names) {
  const allowed = names.map(normalizeName);
  const exact = root.findAll(function (node) {
    return allowed.indexOf(normalizeName(node.name)) !== -1;
  });
  if (exact.length) return exact[0];
  return null;
}

function getAbsoluteX(node) {
  let x = node.x;
  let parent = node.parent;
  while (parent && parent.type !== "PAGE") {
    x += parent.x;
    parent = parent.parent;
  }
  return x;
}

function isMemoryGardenVariantShell(node) {
  const name = normalizeName(node.name);
  return (
    name === normalizeName(MEMORY_GARDEN_FILES_SHELL) ||
    name === normalizeName(MEMORY_GARDEN_PICKER_SHELL) ||
    name === normalizeName(MEMORY_GARDEN_PHONE_PICKER_SHELL)
  );
}

function isAssignableShell(node) {
  return isRoomMobileShell(node) && !isMemoryGardenVariantShell(node);
}

function isRoomMobileShell(node) {
  if (node.type !== "FRAME") return false;
  const name = normalizeName(node.name);
  if (name.indexOf("app") !== 0) return false;
  if (name.indexOf("(mobile)") !== -1) return true;
  return /^app\s*[-—]\s*0[1-5]\b/.test(name);
}

function getOrderedShells(page) {
  return page
    .findAll(function (node) {
      return isAssignableShell(node);
    })
    .filter(function (node) {
      return node.width >= 300 && node.height >= 700;
    })
    .sort(function (a, b) {
      return getAbsoluteX(a) - getAbsoluteX(b);
    });
}

function findShellByExactNames(page, shellNames) {
  if (!shellNames || !shellNames.length) return null;
  for (let i = 0; i < shellNames.length; i++) {
    const target = normalizeName(shellNames[i]);
    const found = page.findAll(function (node) {
      return node.type === "FRAME" && normalizeName(node.name) === target;
    });
    if (found.length) return found[0];
  }
  return null;
}

function findShellBySlotNumber(page, index, assignedIds) {
  const slotLabel = String(index + 1).padStart(2, "0");
  const prefix = normalizeName("App — " + slotLabel);
  const matches = page.findAll(function (node) {
    if (!isAssignableShell(node)) return false;
    return normalizeName(node.name).indexOf(prefix) === 0;
  });
  for (let i = 0; i < matches.length; i++) {
    if (!assignedIds.has(matches[i].id)) return matches[i];
  }
  return null;
}

function screenTitleFromFrameName(name) {
  return normalizeName(name.replace(APP_PREFIX, "").replace(" (mobile)", ""));
}

function findExistingShellByName(page, spec) {
  const titlePatterns = [spec.title].concat(spec.legacyNames || []).map(normalizeName);
  const matches = page.findAll(function (node) {
    if (!isAssignableShell(node)) return false;
    return titlePatterns.indexOf(screenTitleFromFrameName(node.name)) !== -1;
  });
  return matches[0] || null;
}

function findShellForSlot(page, spec, orderedShells, index, assignedIds) {
  let shell = findShellByExactNames(page, spec.shellNames);
  if (shell && assignedIds.has(shell.id)) shell = null;

  if (!shell) {
    shell = findShellBySlotNumber(page, index, assignedIds);
  }

  if (!shell && orderedShells[index] && !assignedIds.has(orderedShells[index].id)) {
    shell = orderedShells[index];
  }

  if (!shell) {
    shell = findExistingShellByName(page, spec);
    if (shell && assignedIds.has(shell.id)) shell = null;
  }

  if (!shell) {
    shell = orderedShells.find(function (candidate) {
      return !assignedIds.has(candidate.id);
    });
  }

  if (shell) assignedIds.add(shell.id);
  return shell;
}

function findLegacyShells(page, pattern, excludeIds) {
  const needle = normalizeName(pattern);
  return page.findAll(function (node) {
    if (!isRoomMobileShell(node)) return false;
    if (excludeIds.has(node.id)) return false;
    return normalizeName(node.name).indexOf(needle) !== -1;
  });
}

function findChildByName(parent, name) {
  if (!parent || !("findAll" in parent)) return null;
  const matches = parent.findAll(function (node) {
    return node.name === name;
  });
  return matches[0] || null;
}

function getImageHash(node) {
  if (!node || !("fills" in node)) return null;
  const fills = node.fills;
  if (!fills || fills === figma.mixed || !Array.isArray(fills)) return null;
  const imageFill = fills.find(function (fill) {
    return fill.type === "IMAGE" && fill.visible !== false && fill.imageHash;
  });
  return imageFill ? imageFill.imageHash : null;
}

function isHotspotUiNode(node) {
  if (!node) return false;
  const name = normalizeName(node.name);
  return (
    name.indexOf("hotspot") !== -1 ||
    name === "area preview" ||
    name === "hotspot dock" ||
    name.indexOf("hotspot icon") !== -1
  );
}

function isRoomArtCandidate(node, minArea) {
  if (!node || isHotspotUiNode(node)) return false;
  if (normalizeName(node.name) === "hotspots overlay") return false;
  return getImageHash(node) && node.width * node.height >= (minArea || 20000);
}

function extractArtImageHash(shell) {
  const viewport = findChildByName(shell, "Room viewport");
  if (!viewport) return null;
  const roomArt = findChildByName(viewport, "Room art");
  if (roomArt && isRoomArtCandidate(roomArt, 20000)) {
    return getImageHash(roomArt);
  }
  const nodes = viewport.findAll(function (node) {
    return isRoomArtCandidate(node, 20000);
  });
  let best = null;
  let bestArea = 0;
  nodes.forEach(function (node) {
    const area = node.width * node.height;
    if (area > bestArea) {
      bestArea = area;
      best = node;
    }
  });
  return best ? getImageHash(best) : null;
}

function extractViewportArtHash(shell) {
  const viewport = findChildByName(shell, "Room viewport");
  if (!viewport) return null;
  const nodes = viewport.findAll(function (node) {
    return isRoomArtCandidate(node, 20000);
  });
  let best = null;
  let bestArea = 0;
  nodes.forEach(function (node) {
    const area = node.width * node.height;
    if (area > bestArea) {
      bestArea = area;
      best = node;
    }
  });
  return best ? getImageHash(best) : null;
}

function removeSideArtifacts(page) {
  let removed = 0;
  page.findAll(function (node) {
    return node.type === "TEXT" && node.name === "→ mobile";
  }).forEach(function (node) {
    node.remove();
    removed++;
  });
  page.findAll(function (node) {
    return normalizeName(node.name).match(/^image\s+\d+$/);
  }).forEach(function (node) {
    node.remove();
    removed++;
  });
  return removed;
}

function resolveHotspotsForSpec(spec) {
  return (spec.hotspots || []).slice(0, 3);
}

function extractHotspotSpecs(shell, viewportW, viewportH) {
  const viewport = findChildByName(shell, "Room viewport");
  if (!viewport) return null;
  const overlay = findChildByName(viewport, "Hotspots overlay");
  if (!overlay || !overlay.children.length) return null;

  const nodes = overlay.children.filter(function (node) {
    return normalizeName(node.name).indexOf("hotspot") !== -1;
  });
  if (!nodes.length) return null;

  return nodes.slice(0, 3).map(function (node) {
    return {
      x: node.x / viewportW,
      y: node.y / viewportH,
      w: node.width / viewportW,
      h: node.height / viewportH,
      primary: normalizeName(node.name).indexOf("primary") !== -1
    };
  });
}

function indexOfBottomHotspot(hotspots) {
  let idx = 0;
  let maxY = -1;
  hotspots.forEach(function (spot, i) {
    if (spot.y > maxY) {
      maxY = spot.y;
      idx = i;
    }
  });
  return idx;
}

function placeShellToRightOf(shell, anchorShell) {
  shell.x = anchorShell.x + W + SCREEN_GAP;
  shell.y = anchorShell.y;
}

function findOrCreateMemoryGardenVariantShell(page, anchorShell, shellName) {
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

function removeDuplicateMemoryGardenShells(page, keepId) {
  let removed = 0;
  page.findAll(function (node) {
    if (node.type !== "FRAME") return false;
    const name = normalizeName(node.name);
    return (
      name === normalizeName("App — Memory Garden Room (mobile)") ||
      name === normalizeName("Memory Garden Room (mobile)")
    );
  }).forEach(function (node) {
    if (node.id !== keepId) {
      node.remove();
      removed++;
    }
  });
  return removed;
}

function cleanupOrphanScreens(page, keepIds) {
  const keep = new Set(keepIds);
  let removed = 0;
  page.findAll(function (node) {
    return isRoomMobileShell(node);
  }).forEach(function (node) {
    if (!keep.has(node.id)) {
      node.remove();
      removed++;
    }
  });
  return removed;
}

function isInsideMobileShell(node) {
  let parent = node.parent;
  while (parent && parent.type !== "PAGE") {
    if (parent.type === "FRAME" && isRoomMobileShell(parent)) return true;
    parent = parent.parent;
  }
  return false;
}

function resolveEmbeddedIconHashes() {
  return HOTSPOT_ICON_SOURCES.map(function (src) {
    if (src && src.base64) {
      return figma.createImage(base64ToBytes(src.base64)).hash;
    }
    return null;
  });
}

function removeLooseHotspotIconSources(page) {
  let removed = 0;
  HOTSPOT_ICON_NAMES.forEach(function (name) {
    const target = normalizeName(name);
    page.findAll(function (node) {
      return normalizeName(node.name) === target && getImageHash(node);
    }).forEach(function (node) {
      if (isInsideMobileShell(node)) return;
      node.remove();
      removed++;
    });
  });
  return removed;
}

async function resolveEmbeddedArtHashes() {
  const hashes = [];
  for (let i = 0; i < SCREENS.length; i++) {
    const srcDef = ROOM_SOURCES[i];
    if (srcDef && srcDef.base64) {
      hashes.push(figma.createImage(base64ToBytes(srcDef.base64)).hash);
    } else {
      hashes.push(null);
    }
  }
  return hashes;
}

function cloneScreenSpec(item) {
  return {
    title: item.title,
    navTitle: item.navTitle,
    shellNames: item.shellNames ? item.shellNames.slice() : [],
    legacyNames: item.legacyNames ? item.legacyNames.slice() : [],
    showHotspots: item.showHotspots,
    hotspots: (item.hotspots || []).map(function (spot) {
      return {
        x: spot.x,
        y: spot.y,
        w: spot.w,
        h: spot.h,
        primary: !!spot.primary,
        round: !!spot.round
      };
    }),
    embeddedImage: !!item.embeddedImage,
    hotspotStyle: item.hotspotStyle || "default",
    artFrame: item.artFrame
      ? {
          scale: item.artFrame.scale || 1,
          panX: item.artFrame.panX || 0,
          panY: item.artFrame.panY || 0
        }
      : null
  };
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
  bar.fills = solid(hex("#061524"));
  parent.appendChild(bar);
  createText(bar, {
    text: "9:41",
    size: 14,
    color: "#f8e6c8",
    weight: "Semi Bold",
    x: 24,
    y: 14
  });
  return bar;
}

function createMobileNav(parent, spec) {
  const nav = figma.createFrame();
  nav.name = "Navigation bar";
  nav.resize(W, NAV_H);
  nav.y = STATUS_H;
  nav.fills = solid(hex("#061524"));
  nav.strokes = solid(hex("#ffffff"), 0.08);
  nav.strokeWeight = 1;
  parent.appendChild(nav);

  createText(nav, {
    text: "‹",
    size: 22,
    color: "#f1bd77",
    x: 12,
    y: 10
  });
  createText(nav, {
    text: spec.navTitle,
    size: 15,
    color: "#f8e6c8",
    weight: "Semi Bold",
    x: W / 2 - spec.navTitle.length * 4,
    y: 14
  });
  createText(nav, {
    text: "···",
    size: 16,
    color: "#f1bd77",
    x: W - 36,
    y: 12
  });
  return nav;
}

function createHotspot(parent, spec, viewportW, viewportH, hotspotStyle) {
  const style = hotspotStyle || "default";
  const size = Math.max(spec.round ? 36 : 28, viewportW * spec.w);
  const height = Math.max(spec.round ? 36 : 28, viewportH * spec.h);
  const frame = figma.createFrame();
  frame.name = spec.primary ? "Hotspot (primary)" : "Hotspot";
  frame.resize(size, height);
  frame.x = viewportW * spec.x;
  frame.y = viewportH * spec.y;

  if (style === "glow") {
    if (spec.active) {
      frame.fills = solid(hex("#f1bd77"), 0.18);
      frame.strokes = solid(hex("#ffe9b8"), 0.98);
      frame.strokeWeight = 2.5;
    } else if (spec.dimmed) {
      frame.fills = solid(hex("#f1bd77"), 0.03);
      frame.strokes = solid(hex("#e8c48c"), 0.32);
      frame.strokeWeight = 1.25;
    } else {
      frame.fills = solid(hex("#f1bd77"), spec.primary ? 0.07 : 0.04);
      frame.strokes = solid(hex(spec.primary ? "#ffe9b8" : "#e8c48c"), spec.primary ? 0.85 : 0.62);
      frame.strokeWeight = spec.primary ? 2 : 1.5;
    }
    frame.cornerRadius = spec.round
      ? Math.min(frame.width, frame.height) / 2
      : spec.radius || 14;
  } else {
    frame.fills = solid(hex("#be9155"), spec.primary ? 0.22 : 0.12);
    frame.strokes = solid(hex(spec.primary ? "#e8c48c" : "#d2b278"), spec.primary ? 0.9 : 0.55);
    frame.strokeWeight = spec.primary ? 2.5 : 1.5;
    frame.cornerRadius = spec.round ? Math.min(frame.width, frame.height) / 2 : 10;
  }

  parent.appendChild(frame);
  return frame;
}

function createHotspotDock(parent, iconHashes, activeIconIndex) {
  const dock = figma.createFrame();
  dock.name = "Hotspot dock";
  dock.resize(W, HOTSPOT_DOCK_H);
  dock.fills = solid(hex("#061524"), 0.96);
  dock.strokes = solid(hex("#ffffff"), 0.08);
  dock.strokeWeight = 1;
  parent.appendChild(dock);

  const iconSize = 44;
  const gap = (W - iconHashes.length * iconSize) / (iconHashes.length + 1);

  iconHashes.forEach(function (hash, i) {
    const isActive = activeIconIndex === i;
    const wrap = figma.createFrame();
    wrap.name = "Hotspot icon slot " + (i + 1);
    wrap.resize(iconSize, iconSize);
    wrap.x = gap + i * (iconSize + gap);
    wrap.y = (HOTSPOT_DOCK_H - iconSize) / 2;
    wrap.cornerRadius = iconSize / 2;
    wrap.fills = solid(hex(isActive ? "#4a3626" : "#2f2219"), 1);
    if (isActive) {
      wrap.strokes = solid(hex("#ffe9b8"), 0.92);
      wrap.strokeWeight = 2.5;
    }
    dock.appendChild(wrap);

    const icon = figma.createRectangle();
    icon.name = "Area preview";
    icon.resize(iconSize, iconSize);
    icon.cornerRadius = iconSize / 2;
    if (hash) {
      icon.fills = [{ type: "IMAGE", imageHash: hash, scaleMode: "FILL" }];
    } else {
      icon.fills = solid(hex("#2f2219"), 1);
    }
    wrap.appendChild(icon);
  });

  return dock;
}

function createAddFileButton(parent, opts) {
  const size = opts.size || 44;
  const btn = figma.createFrame();
  btn.name = opts.active ? "Add file button (active)" : "Add file button";
  btn.resize(size, size);
  btn.x = opts.x;
  btn.y = opts.y;
  btn.cornerRadius = size / 2;
  btn.fills = solid(hex(opts.active ? "#5c4528" : "#1a2430"), 1);
  btn.strokes = solid(hex("#ffe9b8"), opts.active ? 1 : 0.42);
  btn.strokeWeight = opts.active ? 3 : 1.5;
  btn.layoutMode = "HORIZONTAL";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.paddingLeft = 0;
  btn.paddingRight = 0;
  btn.paddingTop = 0;
  btn.paddingBottom = 0;
  if (opts.active) {
    btn.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.91, b: 0.72, a: 0.55 },
        offset: { x: 0, y: 0 },
        radius: 14,
        spread: 2,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
  }
  parent.appendChild(btn);

  const plus = figma.createText();
  plus.name = "Plus icon";
  plus.fontName = { family: "Inter", style: "Semi Bold" };
  plus.characters = "+";
  plus.fontSize = 26;
  plus.lineHeight = { unit: "PIXELS", value: 26 };
  plus.fills = solid(hex(opts.active ? "#fff4dc" : "#d2b278"), 1);
  plus.textAutoResize = "WIDTH_AND_HEIGHT";
  btn.appendChild(plus);

  return btn;
}

function createFilePopup(parent, opts) {
  const files = opts.files || [];
  const rowH = 48;
  const rowGap = 8;
  const listTop = 54;
  const footerH = 58;
  const popupW = W - 16;
  const popupH = listTop + files.length * (rowH + rowGap) + footerH + 12;
  const popup = figma.createFrame();
  popup.name = "File popup";
  popup.resize(popupW, popupH);
  popup.x = 8;
  popup.y = opts.y || STATUS_H + NAV_H + 10;
  popup.cornerRadius = 18;
  popup.fills = solid(hex("#0f1824"), 0.94);
  popup.strokes = solid(hex("#e8c48c"), 0.55);
  popup.strokeWeight = 1.5;
  popup.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 8 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  parent.appendChild(popup);

  const iconWrap = figma.createFrame();
  iconWrap.name = "Book icon";
  iconWrap.resize(36, 36);
  iconWrap.x = 16;
  iconWrap.y = 14;
  iconWrap.cornerRadius = 18;
  iconWrap.fills = solid(hex("#2f2219"), 1);
  iconWrap.strokes = solid(hex("#ffe9b8"), 0.85);
  iconWrap.strokeWeight = 2;
  popup.appendChild(iconWrap);

  const bookIcon = figma.createRectangle();
  bookIcon.name = "Book preview";
  bookIcon.resize(36, 36);
  bookIcon.cornerRadius = 18;
  if (opts.bookIconHash) {
    bookIcon.fills = [{ type: "IMAGE", imageHash: opts.bookIconHash, scaleMode: "FILL" }];
  } else {
    bookIcon.fills = solid(hex("#2f2219"), 1);
  }
  iconWrap.appendChild(bookIcon);

  createText(popup, {
    text: "Related files",
    size: 14,
    color: "#f8e6c8",
    weight: "Semi Bold",
    x: 62,
    y: 22,
    name: "Popup title"
  });

  files.forEach(function (title, i) {
    const row = figma.createFrame();
    row.name = "File row " + (i + 1);
    row.resize(popup.width - 32, rowH);
    row.x = 16;
    row.y = listTop + i * (rowH + rowGap);
    row.fills = solid(hex("#ffffff"), 0.05);
    row.cornerRadius = 12;
    popup.appendChild(row);

    const fileIcon = figma.createFrame();
    fileIcon.name = "File icon";
    fileIcon.resize(24, 28);
    fileIcon.x = 12;
    fileIcon.y = 10;
    fileIcon.cornerRadius = 4;
    fileIcon.fills = solid(hex("#7170ff"), 0.22);
    fileIcon.strokes = solid(hex("#a09fff"), 0.65);
    fileIcon.strokeWeight = 1;
    row.appendChild(fileIcon);

    const fold = figma.createRectangle();
    fold.name = "File fold";
    fold.resize(8, 8);
    fold.x = 16;
    fold.y = 10;
    fold.fills = solid(hex("#a09fff"), 0.35);
    fileIcon.appendChild(fold);

    const label = createText(row, {
      text: title,
      size: 12,
      color: "#f8e6c8",
      x: 44,
      y: 16,
      name: "File title"
    });
    label.textAutoResize = "HEIGHT";
    label.resize(row.width - 56, label.height);
  });

  const plusY = listTop + files.length * (rowH + rowGap) + 6;
  createAddFileButton(popup, {
    x: (popup.width - 44) / 2,
    y: plusY,
    active: !!opts.highlightPlus
  });

  return popup;
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
    icon.fills = solid(hex(opts.iconColor), 0.9);
    row.appendChild(icon);
  }

  createText(row, {
    text: opts.label,
    size: 17,
    color: opts.textColor || "#000000",
    x: opts.iconColor ? 56 : 16,
    y: (row.height - 17) / 2,
    name: "Row label"
  });

  if (opts.chevron) {
    createText(row, {
      text: "›",
      size: 20,
      color: "#c7c7cc",
      x: row.width - 28,
      y: (row.height - 20) / 2,
      name: "Chevron"
    });
  }

  if (opts.divider) {
    const divider = figma.createRectangle();
    divider.name = "Divider";
    divider.resize(row.width - (opts.iconColor ? 56 : 16), 1);
    divider.x = opts.iconColor ? 56 : 16;
    divider.y = row.height - 1;
    divider.fills = solid(hex("#e5e5ea"), 1);
    row.appendChild(divider);
  }

  return row;
}

function createPhoneFilePicker(parent) {
  const overlay = figma.createFrame();
  overlay.name = "File picker overlay";
  overlay.resize(W, H);
  overlay.x = 0;
  overlay.y = 0;
  overlay.fills = solid(hex("#000000"), 0.38);
  parent.appendChild(overlay);

  const sheet = figma.createFrame();
  sheet.name = "File picker sheet";
  sheet.resize(W, H - STATUS_H);
  sheet.x = 0;
  sheet.y = STATUS_H;
  sheet.fills = solid(hex("#f2f2f7"), 1);
  overlay.appendChild(sheet);

  const navBar = figma.createFrame();
  navBar.name = "Picker navigation";
  navBar.resize(W, 52);
  navBar.fills = solid(hex("#f2f2f7"), 1);
  sheet.appendChild(navBar);

  createText(navBar, {
    text: "Cancel",
    size: 17,
    color: "#007aff",
    x: 16,
    y: 16,
    name: "Cancel"
  });
  createText(navBar, {
    text: "Browse",
    size: 17,
    color: "#000000",
    weight: "Semi Bold",
    x: W / 2 - 34,
    y: 16,
    name: "Title"
  });

  const search = figma.createFrame();
  search.name = "Search bar";
  search.resize(W - 32, 36);
  search.x = 16;
  search.y = 56;
  search.cornerRadius = 10;
  search.fills = solid(hex("#e3e3e8"), 1);
  sheet.appendChild(search);
  createText(search, {
    text: "Search",
    size: 16,
    color: "#8e8e93",
    x: 12,
    y: 9,
    name: "Search placeholder"
  });

  const locationsCard = figma.createFrame();
  locationsCard.name = "Locations";
  locationsCard.resize(W - 32, 148);
  locationsCard.x = 16;
  locationsCard.y = 108;
  locationsCard.cornerRadius = 12;
  locationsCard.fills = solid(hex("#ffffff"), 1);
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

  createText(sheet, {
    text: "RECENTS",
    size: 12,
    color: "#8e8e93",
    weight: "Medium",
    x: 32,
    y: 272,
    name: "Recents section"
  });

  const recentsCard = figma.createFrame();
  recentsCard.name = "Recent files";
  recentsCard.resize(W - 32, 196);
  recentsCard.x = 16;
  recentsCard.y = 296;
  recentsCard.cornerRadius = 12;
  recentsCard.fills = solid(hex("#ffffff"), 1);
  recentsCard.clipsContent = true;
  sheet.appendChild(recentsCard);

  const recentItems = [
    { label: "Garden notes.pdf", color: "#ff3b30" },
    { label: "Planting calendar.docx", color: "#007aff" },
    { label: "Photos", color: "#ff9500" },
    { label: "Downloads", color: "#8e8e93" }
  ];

  recentItems.forEach(function (item, i) {
    createPickerRow(recentsCard, {
      name: "Recent " + (i + 1),
      y: i * 48,
      label: item.label,
      iconColor: item.color,
      chevron: true,
      divider: i < recentItems.length - 1
    });
  });

  const homeIndicator = figma.createRectangle();
  homeIndicator.name = "Picker home indicator";
  homeIndicator.resize(134, 5);
  homeIndicator.x = (W - 134) / 2;
  homeIndicator.y = sheet.height - 12;
  homeIndicator.cornerRadius = 3;
  homeIndicator.fills = solid(hex("#000000"), 0.22);
  sheet.appendChild(homeIndicator);

  return overlay;
}

function addEmbeddedArt(viewport, imageHash, viewportW, viewportH, artFrame) {
  const scale = artFrame && artFrame.scale ? artFrame.scale : 1;
  const panX = artFrame && artFrame.panX ? artFrame.panX : 0;
  const panY = artFrame && artFrame.panY ? artFrame.panY : 0;
  const art = figma.createRectangle();
  art.name = "Room art";
  art.resize(viewportW * scale, viewportH * scale);
  art.x = panX;
  art.y = panY;
  art.fills = [{ type: "IMAGE", imageHash: imageHash, scaleMode: "FILL" }];
  viewport.appendChild(art);
  return art;
}

function buildAppScreen(spec, iconHashes, existingShell, artHash, hotspotSpecs, buildOptions) {
  const options = buildOptions || {};
  const topOffset = STATUS_H + NAV_H;
  const viewportH = H - topOffset - HOTSPOT_DOCK_H - HOME_INDICATOR_H;
  const hotspots = (hotspotSpecs || spec.hotspots || []).slice(0, 3);
  const shell = existingShell;
  const savedX = shell.x;
  const savedY = shell.y;

  clearFrame(shell);
  shell.name = options.shellName || APP_PREFIX + spec.title + " (mobile)";
  shell.resize(W, H);
  shell.x = savedX;
  shell.y = savedY;
  shell.cornerRadius = RADIUS;
  shell.clipsContent = true;
  shell.fills = solid(hex("#08090a"));
  shell.strokes = solid(hex("#7170ff"), 0.28);
  shell.strokeWeight = 2;

  createStatusBar(shell);
  createMobileNav(shell, spec);

  const viewport = figma.createFrame();
  viewport.name = "Room viewport";
  viewport.resize(W, viewportH);
  viewport.y = topOffset;
  viewport.clipsContent = true;
  viewport.fills = solid(hex("#120e0b"));
  shell.appendChild(viewport);

  if (artHash) {
    addEmbeddedArt(viewport, artHash, W, viewportH, spec.artFrame);
  }

  const overlay = figma.createFrame();
  overlay.name = "Hotspots overlay";
  overlay.resize(W, viewportH);
  overlay.fills = [];
  viewport.appendChild(overlay);

  if (spec.showHotspots !== false) {
    hotspots.forEach(function (spot, index) {
      const spotSpec = {
        x: spot.x,
        y: spot.y,
        w: spot.w,
        h: spot.h,
        primary: !!spot.primary,
        round: !!spot.round,
        radius: spot.radius,
        active: options.activeHotspotIndex === index,
        dimmed: options.dimInactiveHotspots && options.activeHotspotIndex !== index
      };
      createHotspot(overlay, spotSpec, W, viewportH, spec.hotspotStyle);
    });
  }

  if (!hotspots.length || spec.showHotspots === false) {
    overlay.remove();
  }

  const dock = createHotspotDock(shell, iconHashes, options.activeDockIconIndex);
  dock.y = topOffset + viewportH;

  if (options.filePopup) {
    createFilePopup(shell, {
      y: topOffset + 10,
      bookIconHash: options.filePopup.bookIconHash,
      files: options.filePopup.files || [],
      highlightPlus: !!options.filePopup.highlightPlus
    });
  }

  if (options.phoneFilePicker) {
    createPhoneFilePicker(shell);
  } else {
    const homeIndicator = figma.createRectangle();
    homeIndicator.name = "Home indicator";
    homeIndicator.resize(120, 4);
    homeIndicator.x = (W - 120) / 2;
    homeIndicator.y = H - 10;
    homeIndicator.cornerRadius = 2;
    homeIndicator.fills = solid(hex("#ffffff"), 0.28);
    shell.appendChild(homeIndicator);
  }

  return shell;
}

async function buildScreens() {
  await loadFonts();

  const page = figma.currentPage;

  if (!MEMORY_GARDEN_BASE64 || !HOTSPOT_ICON_SOURCES.length || !HOTSPOT_ICON_SOURCES[0].base64) {
    figma.closePlugin("Run node embed-room-sources.js before using this plugin.");
    return;
  }

  const iconHashes = resolveEmbeddedIconHashes();
  if (iconHashes.filter(Boolean).length < HOTSPOT_ICON_SOURCES.length) {
    figma.closePlugin("Hotspot icon images missing in plugin. Run node embed-room-sources.js.");
    return;
  }

  const memoryGardenImage = figma.createImage(base64ToBytes(MEMORY_GARDEN_BASE64));
  const artHashes = await resolveEmbeddedArtHashes();
  const orderedShells = getOrderedShells(page);

  const assignedIds = new Set();
  const shellArtCache = {};

  orderedShells.forEach(function (shell) {
    shellArtCache[shell.id] =
      extractArtImageHash(shell) || extractViewportArtHash(shell);
  });

  const removedSideArtifacts = removeSideArtifacts(page);

  const built = [];
  const missingShells = [];
  const missingArt = [];
  let memoryGardenHotspotSpecs = null;
  let memoryGardenShell = null;
  let memoryGardenArtHash = null;

  for (let i = 0; i < SCREENS.length; i++) {
    const spec = cloneScreenSpec(SCREENS[i]);
    const shell = findShellForSlot(page, spec, orderedShells, i, assignedIds);

    if (!shell) {
      missingShells.push(spec.title);
      continue;
    }

    const preservedArtHash = shellArtCache[shell.id] || null;
    const artHash = spec.embeddedImage
      ? memoryGardenImage.hash
      : artHashes[i] || preservedArtHash;
    if (!artHash) {
      missingArt.push(spec.title);
    }

    const viewportH = H - (STATUS_H + NAV_H) - HOTSPOT_DOCK_H - HOME_INDICATOR_H;
    let hotspotSpecs = resolveHotspotsForSpec(spec);

    if (spec.title === "Memory Garden") {
      removeDuplicateMemoryGardenShells(page, shell.id);
      const preservedHotspots = extractHotspotSpecs(shell, W, viewportH);
      if (preservedHotspots && preservedHotspots.length) {
        hotspotSpecs = preservedHotspots;
      }
      memoryGardenHotspotSpecs = hotspotSpecs;
      memoryGardenShell = shell;
      memoryGardenArtHash = artHash;
    }

    built.push(buildAppScreen(spec, iconHashes, shell, artHash, hotspotSpecs));
  }

  if (memoryGardenShell && memoryGardenHotspotSpecs && memoryGardenHotspotSpecs.length) {
    const bottomIdx = indexOfBottomHotspot(memoryGardenHotspotSpecs);
    const filesSpec = cloneScreenSpec(SCREENS[2]);
    const variantOptions = {
      activeHotspotIndex: bottomIdx,
      dimInactiveHotspots: true,
      activeDockIconIndex: 0,
      filePopup: {
        bookIconHash: iconHashes[0],
        files: MEMORY_GARDEN_FILES
      }
    };

    const filesShell = findOrCreateMemoryGardenVariantShell(
      page,
      memoryGardenShell,
      MEMORY_GARDEN_FILES_SHELL
    );
    built.push(
      buildAppScreen(
        filesSpec,
        iconHashes,
        filesShell,
        memoryGardenArtHash,
        memoryGardenHotspotSpecs,
        Object.assign({ shellName: MEMORY_GARDEN_FILES_SHELL }, variantOptions)
      )
    );

    const pickerShell = findOrCreateMemoryGardenVariantShell(
      page,
      filesShell,
      MEMORY_GARDEN_PICKER_SHELL
    );
    built.push(
      buildAppScreen(
        filesSpec,
        iconHashes,
        pickerShell,
        memoryGardenArtHash,
        memoryGardenHotspotSpecs,
        Object.assign({ shellName: MEMORY_GARDEN_PICKER_SHELL }, variantOptions, {
          filePopup: {
            bookIconHash: iconHashes[0],
            files: MEMORY_GARDEN_FILES,
            highlightPlus: true
          }
        })
      )
    );

    const phonePickerShell = findOrCreateMemoryGardenVariantShell(
      page,
      pickerShell,
      MEMORY_GARDEN_PHONE_PICKER_SHELL
    );
    built.push(
      buildAppScreen(
        filesSpec,
        iconHashes,
        phonePickerShell,
        memoryGardenArtHash,
        memoryGardenHotspotSpecs,
        Object.assign({ shellName: MEMORY_GARDEN_PHONE_PICKER_SHELL }, variantOptions, {
          filePopup: {
            bookIconHash: iconHashes[0],
            files: MEMORY_GARDEN_FILES,
            highlightPlus: true
          },
          phoneFilePicker: true
        })
      )
    );
  }

  const livingRoomSpec = cloneScreenSpec(SCREENS[4]);
  const legacyLivingRoom = findLegacyShells(page, "05 room detail", assignedIds);
  legacyLivingRoom.forEach(function (shell) {
    assignedIds.add(shell.id);
    const preservedArtHash =
      shellArtCache[shell.id] || extractArtImageHash(shell) || null;
    const artHash = artHashes[4] || preservedArtHash;
    built.push(buildAppScreen(livingRoomSpec, iconHashes, shell, artHash, resolveHotspotsForSpec(livingRoomSpec)));
  });

  if (built.length === 0) {
    figma.closePlugin(
      "No room mobile frames found. Need App — Library (mobile) … App — Living Room (mobile)."
    );
    return;
  }

  const removedOrphans = cleanupOrphanScreens(
    page,
    built.map(function (shell) {
      return shell.id;
    })
  );

  const removedIconSources = removeLooseHotspotIconSources(page);

  if (built.length) {
    figma.viewport.scrollAndZoomIntoView(built);
  }

  const missingShellText = missingShells.length
    ? " Missing screens: " + missingShells.join(", ") + "."
    : "";
  const missingArtText = missingArt.length
    ? " Missing backgrounds: " + missingArt.join(", ") + "."
    : "";

  figma.closePlugin(
    "Updated " +
      built.length +
      " screens: Library, Shop, Memory Garden, Memory Garden — Files, Add file, Phone picker, Desk, Living Room." +
      missingShellText +
      missingArtText +
      " Removed side artifacts: " +
      removedSideArtifacts +
      ". Removed canvas icon sources: " +
      removedIconSources +
      ". Removed orphans: " +
      removedOrphans +
      "."
  );
}

buildScreens().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
