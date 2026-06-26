/**
 * Locus Chamber — Archive screen patches (in-place, no full rebuild).
 *
 * Archive - 1: nav title "Archive", Archive tab active
 * Archive - 2: Desk room highlighted
 * Archive - 3: mixed file list (photos + documents)
 */

const ARCHIVE_SHELL_1 = "Archive - 1";
const ARCHIVE_SHELL_2 = "Archive - 2";
const ARCHIVE_SHELL_3 = "Archive - 3";
const NAV_TITLE = "Archive";
const HIGHLIGHT_ROOM = "Desk";
const ARCHIVE_TAB_INDEX = 3;
const SCREEN_GAP = 32;
const SIDE = 16;
const STATUS_H = 44;
const NAV_H = 52;
const TAB_H = 72;
const HOME_INDICATOR_H = 20;
const FILE_LIST_NAME = "Archive file list";
const SECTION_FILES = "Files";

const ARCHIVE_FILES = [
  { type: "photo", title: "2025-06-02 · Morning light.jpg", scene: "morning" },
  { type: "photo", title: "2025-07-12 · Terrace sunset.jpg", scene: "sunset" },
  { type: "doc", title: "Project notes.pdf" },
  { type: "doc", title: "Memory log — Desk.docx" },
  { type: "photo", title: "2025-03-14 · Garden path.jpg", scene: "garden" },
  { type: "photo", title: "2025-06-28 · Kitchen window.jpg", scene: "kitchen" },
  { type: "doc", title: "Archive index.txt" },
  { type: "photo", title: "2024-11-04 · Autumn walk.jpg", scene: "autumn" },
  { type: "doc", title: "Reading list — Q1.pdf" },
  { type: "photo", title: "2025-01-22 · Frost on glass.jpg", scene: "frost" }
];

const TABS = ["Chambers", "Chronology", "Create room", "Archive", "Profile"];

const THEME = {
  text: "#f8e6c8",
  muted: "#bba987",
  accent: "#f1bd77",
  line: "#d7a663",
  card: "#061524"
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

function removeNodesByName(root, name) {
  root.findAll(function (node) {
    return node.name === name;
  }).forEach(function (node) {
    node.remove();
  });
}

function setNavTitle(shell, title) {
  const titleNode = shell.findOne(function (node) {
    return node.type === "TEXT" && node.name === "Screen title";
  });
  if (!titleNode) return false;
  titleNode.characters = title;
  titleNode.textAlignHorizontal = "CENTER";
  return true;
}

function updateTabBar(shell, activeIndex) {
  const bar = shell.findOne(function (node) {
    return node.type === "FRAME" && node.name === "Bottom navigation";
  });
  if (!bar) return false;

  bar.children.forEach(function (slot) {
    if (slot.type !== "FRAME" || slot.name.indexOf("Tab —") !== 0) return;

    const label = slot.name.replace(/^Tab —\s*/, "");
    const index = TABS.indexOf(label);
    const active = index === activeIndex;

    slot.findAll(function (node) {
      return node.name === "Tab icon" && node.type === "ELLIPSE";
    }).forEach(function (dot) {
      dot.fills = solid(active ? THEME.accent : THEME.muted, active ? 1 : 0.45);
    });

    slot.findAll(function (node) {
      return node.type === "TEXT" && node.name === "Tab label";
    }).forEach(function (tabLabel) {
      tabLabel.fontName = { family: "Inter", style: active ? "Semi Bold" : "Regular" };
      tabLabel.fills = solid(active ? THEME.text : THEME.muted, active ? 1 : 0.78);
    });
  });

  return true;
}

function findRoomCards(shell) {
  return shell.findAll(function (node) {
    return node.type === "FRAME" && node.name.indexOf("Room —") === 0;
  });
}

function resetRoomHighlights(shell) {
  removeNodesByName(shell, "Room highlight");

  findRoomCards(shell).forEach(function (card) {
    card.opacity = 1;
    card.fills = solid(THEME.card, 0.62);
    card.strokes = solid(THEME.line, 0.28);
    card.strokeWeight = 1;
    card.effects = [];

    card.findAll(function (node) {
      return node.type === "TEXT" && node.name === "Room title";
    }).forEach(function (label) {
      label.fills = solid(THEME.text, 1);
      label.fontName = { family: "Inter", style: "Semi Bold" };
    });

    card.findAll(function (node) {
      return node.type === "TEXT" && node.name === "Room subtitle";
    }).forEach(function (label) {
      label.fills = solid(THEME.muted, 0.92);
    });
  });
}

function highlightRoomCard(shell, roomTitle, dimOthers) {
  resetRoomHighlights(shell);
  const target = normalizeName(roomTitle);
  let matched = false;

  findRoomCards(shell).forEach(function (card) {
    const cardTitle = card.name.replace(/^Room —\s*/, "");
    const isTarget = normalizeName(cardTitle) === target;

    if (isTarget) {
      matched = true;
      const cardW = card.width;

      const glow = figma.createRectangle();
      glow.name = "Room highlight";
      glow.resize(cardW + 12, 88);
      glow.x = card.x - 6;
      glow.y = card.y - 6;
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
        }
      ];
      shell.insertChild(shell.children.indexOf(card), glow);

      card.fills = solid(THEME.card, 0.74);
      card.strokes = solid(THEME.line, 0.72);
      card.strokeWeight = 2;
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

      card.findAll(function (node) {
        return node.type === "TEXT" && node.name === "Room title";
      }).forEach(function (label) {
        label.fills = solid(THEME.accent, 1);
      });
    } else if (dimOthers) {
      card.opacity = 0.42;
    }
  });

  return matched;
}

function patchArchiveBase(shell) {
  setNavTitle(shell, NAV_TITLE);
  updateTabBar(shell, ARCHIVE_TAB_INDEX);
  resetRoomHighlights(shell);

  shell.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Section title";
  }).forEach(function (node) {
    node.visible = true;
    node.characters = "Rooms";
  });

  findRoomCards(shell).forEach(function (card) {
    card.visible = true;
  });

  removeNodesByName(shell, FILE_LIST_NAME);
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
  if (opts.width) {
    node.resize(opts.width, node.height);
    node.textAutoResize = "HEIGHT";
  }
  node.x = opts.x || 0;
  node.y = opts.y || 0;
  parent.appendChild(node);
  return node;
}

function hideRoomList(shell) {
  removeNodesByName(shell, "Room highlight");

  shell.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Section title";
  }).forEach(function (node) {
    node.visible = false;
  });

  findRoomCards(shell).forEach(function (card) {
    card.visible = false;
  });
}

function setSectionTitle(shell, text) {
  shell.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Section title";
  }).forEach(function (node) {
    node.visible = true;
    node.characters = text;
  });
}

function addThumbRect(parent, x, y, w, h, color, opacity, radius) {
  const node = figma.createRectangle();
  node.resize(w, h);
  node.x = x;
  node.y = y;
  if (radius) node.cornerRadius = radius;
  node.fills = solid(color, opacity == null ? 1 : opacity);
  parent.appendChild(node);
  return node;
}

function drawPhotoThumb(parent, scene) {
  if (scene === "sunset") {
    addThumbRect(parent, 0, 0, 40, 18, "#d97852", 1);
    addThumbRect(parent, 0, 16, 40, 24, "#4a3b2f", 1);
    const sun = figma.createEllipse();
    sun.resize(12, 12);
    sun.x = 24;
    sun.y = 4;
    sun.fills = solid("#ffe3a8", 1);
    parent.appendChild(sun);
  } else if (scene === "kitchen") {
    addThumbRect(parent, 0, 0, 40, 40, "#2a3440", 1);
    addThumbRect(parent, 10, 8, 20, 24, "#9ec9e8", 0.55, 2);
  } else if (scene === "morning") {
    addThumbRect(parent, 0, 0, 40, 40, "#6a8fb5", 0.35);
    addThumbRect(parent, 0, 0, 8, 40, "#c9a57a", 0.75);
    addThumbRect(parent, 32, 0, 8, 40, "#c9a57a", 0.75);
    const sun = figma.createEllipse();
    sun.resize(10, 10);
    sun.x = 15;
    sun.y = 8;
    sun.fills = solid("#ffe9b0", 1);
    parent.appendChild(sun);
  } else if (scene === "garden") {
    addThumbRect(parent, 0, 22, 40, 18, "#4f7a4a", 1);
    addThumbRect(parent, 12, 0, 16, 30, "#b9a48a", 1);
  } else if (scene === "autumn") {
    addThumbRect(parent, 0, 18, 40, 22, "#6b4f35", 1);
    addThumbRect(parent, 0, 0, 14, 14, "#b86a32", 0.85, 7);
  } else if (scene === "frost") {
    addThumbRect(parent, 0, 0, 40, 40, "#c8dce8", 0.65, 2);
    addThumbRect(parent, 8, 8, 12, 8, "#ffffff", 0.55, 2);
  } else {
    addThumbRect(parent, 0, 0, 40, 40, THEME.muted, 0.35, 4);
  }
}

function drawDocIcon(parent) {
  const file = figma.createFrame();
  file.name = "Doc icon";
  file.resize(24, 28);
  file.x = 8;
  file.y = 6;
  file.cornerRadius = 4;
  file.fills = solid("#7170ff", 0.22);
  file.strokes = solid("#a09fff", 0.65);
  file.strokeWeight = 1;
  parent.appendChild(file);

  const fold = figma.createRectangle();
  fold.resize(8, 8);
  fold.x = 12;
  fold.y = 6;
  fold.fills = solid("#a09fff", 0.35);
  file.appendChild(fold);
}

function getContentBounds(shell) {
  return {
    top: STATUS_H + NAV_H + 16,
    bottom: shell.height - TAB_H - HOME_INDICATOR_H - 8,
    width: shell.width - SIDE * 2
  };
}

function addArchiveFileList(shell) {
  removeNodesByName(shell, FILE_LIST_NAME);

  const bounds = getContentBounds(shell);
  const listTop = bounds.top + 28;
  const listH = bounds.bottom - listTop;
  const rowH = 56;
  const rowGap = 10;
  const contentH = ARCHIVE_FILES.length * (rowH + rowGap) - rowGap;

  setSectionTitle(shell, SECTION_FILES);

  const list = figma.createFrame();
  list.name = FILE_LIST_NAME;
  list.resize(bounds.width, listH);
  list.x = SIDE;
  list.y = listTop;
  list.clipsContent = true;
  list.fills = [];
  shell.appendChild(list);

  const content = figma.createFrame();
  content.name = "Archive file list content";
  content.resize(bounds.width, contentH);
  content.fills = [];
  list.appendChild(content);

  ARCHIVE_FILES.forEach(function (file, index) {
    const row = figma.createFrame();
    row.name = "Archive file — " + file.title;
    row.resize(bounds.width, rowH);
    row.y = index * (rowH + rowGap);
    row.cornerRadius = 14;
    row.fills = solid(THEME.card, 0.62);
    row.strokes = solid(THEME.line, 0.22);
    row.strokeWeight = 1;
    content.appendChild(row);

    const thumbWrap = figma.createFrame();
    thumbWrap.name = "File thumb";
    thumbWrap.resize(40, 40);
    thumbWrap.x = 10;
    thumbWrap.y = 8;
    thumbWrap.cornerRadius = 8;
    thumbWrap.clipsContent = true;
    thumbWrap.fills = solid("#02060d", 0.45);
    row.appendChild(thumbWrap);

    if (file.type === "photo") {
      drawPhotoThumb(thumbWrap, file.scene);
    } else {
      drawDocIcon(thumbWrap);
    }

    makeText(row, {
      name: "File title",
      text: file.title,
      size: 12,
      weight: file.type === "doc" ? "Medium" : "Regular",
      color: THEME.text,
      opacity: 0.96,
      x: 58,
      y: 20,
      width: bounds.width - 74
    });
  });

  if (contentH > listH) {
    const track = figma.createRectangle();
    track.name = "Scroll track";
    track.resize(3, listH - 8);
    track.x = bounds.width - 6;
    track.y = 4;
    track.cornerRadius = 2;
    track.fills = solid(THEME.muted, 0.22);
    list.appendChild(track);

    const thumbH = Math.max(44, Math.round(listH * (listH / contentH)));
    const thumb = figma.createRectangle();
    thumb.name = "Scroll thumb";
    thumb.resize(3, thumbH);
    thumb.x = bounds.width - 6;
    thumb.y = 4;
    thumb.cornerRadius = 2;
    thumb.fills = solid(THEME.accent, 0.82);
    list.appendChild(thumb);
  }

  return list;
}

function patchArchiveDeskVariant(shell) {
  setNavTitle(shell, NAV_TITLE);
  updateTabBar(shell, ARCHIVE_TAB_INDEX);
  highlightRoomCard(shell, HIGHLIGHT_ROOM, true);

  shell.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Section title";
  }).forEach(function (node) {
    node.visible = true;
  });
  findRoomCards(shell).forEach(function (card) {
    card.visible = true;
  });
  removeNodesByName(shell, FILE_LIST_NAME);
}

function patchArchiveFilesList(shell) {
  setNavTitle(shell, NAV_TITLE);
  updateTabBar(shell, ARCHIVE_TAB_INDEX);
  hideRoomList(shell);
  addArchiveFileList(shell);
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

async function run() {
  await loadFonts();

  const page = figma.currentPage;
  const notes = [];
  const zoomTargets = [];

  const archive1 = findShell(page, ARCHIVE_SHELL_1);
  if (!archive1) {
    figma.closePlugin('Frame "' + ARCHIVE_SHELL_1 + '" not found.');
    return;
  }

  patchArchiveBase(archive1);
  notes.push(ARCHIVE_SHELL_1 + ': title "' + NAV_TITLE + '", Archive tab active');
  zoomTargets.push(archive1);

  const variant = ensureVariantShell(page, archive1, ARCHIVE_SHELL_2);
  patchArchiveDeskVariant(variant.shell);
  notes.push(
    ARCHIVE_SHELL_2 +
      (variant.created ? ": created" : ": updated") +
      ', "' +
      HIGHLIGHT_ROOM +
      '" highlighted'
  );
  zoomTargets.push(variant.shell);

  const filesVariant = ensureVariantShell(page, variant.shell, ARCHIVE_SHELL_3);
  patchArchiveFilesList(filesVariant.shell);
  notes.push(
    ARCHIVE_SHELL_3 +
      (filesVariant.created ? ": created" : ": updated") +
      ", mixed file list (" +
      ARCHIVE_FILES.length +
      " items)"
  );
  zoomTargets.push(filesVariant.shell);

  figma.viewport.scrollAndZoomIntoView(zoomTargets);
  figma.closePlugin(notes.join(". ") + ".");
}

run().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
