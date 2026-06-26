/**
 * Locus Chamber — Profile tab screen (in-place patch).
 *
 * Keeps bottom navigation, highlights Profile tab, sets nav title,
 * and imports content from the standalone "My Profile" frame.
 *
 * Run on the page that contains Profile (mobile shell), My Profile,
 * and background image "photo_2026-06-13_19-20-01 1".
 */

const PROFILE_SHELL_NAMES = ["Profile", "Profile - 1"];
const NAV_TITLE = "Profile";
const PROFILE_TAB_INDEX = 4;
const PROFILE_CONTENT_NAME = "Profile content";
const BG_IMAGE_NAME = "photo_2026-06-13_19-20-01 1";

const STATUS_H = 44;
const NAV_H = 52;
const TAB_H = 72;
const HOME_INDICATOR_H = 20;

const TABS = ["Chambers", "Chronology", "Create room", "Archive", "Profile"];

const CHROME_NAMES = [
  "Bottom navigation",
  "Hotspot dock",
  "Navigation",
  "Status bar",
  "Home indicator"
];

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

function isAppTabShell(frame) {
  const bar = frame.findOne(function (node) {
    return node.type === "FRAME" && node.name === "Bottom navigation";
  });
  if (!bar) return false;
  return bar.findAll(function (node) {
    return node.name.indexOf("Tab —") === 0;
  }).length >= 4;
}

function findProfileMobileShell(page) {
  let i;
  for (i = 0; i < PROFILE_SHELL_NAMES.length; i++) {
    const shell = findShell(page, PROFILE_SHELL_NAMES[i]);
    if (shell && isAppTabShell(shell)) return shell;
  }

  const matches = page.findAll(function (node) {
    if (node.type !== "FRAME" || !isAppTabShell(node)) return false;
    const name = normalizeName(node.name);
    if (name === "my profile") return false;
    return name === "profile" || name.indexOf("profile") !== -1;
  });

  matches.sort(function (a, b) {
    return b.width * b.height - a.width * a.height;
  });

  return matches[0] || null;
}

function isMyProfileName(name) {
  const normalized = normalizeName(name);
  return (
    normalized === "my profile" ||
    normalized === "мой профиль" ||
    normalized === "мой аккаунт"
  );
}

function findMyProfileSource(page, excludeId) {
  const candidates = page.findAll(function (node) {
    if (node.type !== "FRAME" || node.id === excludeId) return false;
    return isMyProfileName(node.name);
  });

  candidates.sort(function (a, b) {
    const aStandalone = isAppTabShell(a) ? 0 : 1;
    const bStandalone = isAppTabShell(b) ? 0 : 1;
    if (aStandalone !== bStandalone) return bStandalone - aStandalone;
    return b.width * b.height - a.width * a.height;
  });

  return candidates[0] || null;
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

function hideChambersContent(shell) {
  removeNodesByName(shell, "Room highlight");
  removeNodesByName(shell, PROFILE_CONTENT_NAME);

  shell.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Section title";
  }).forEach(function (node) {
    node.visible = false;
  });

  findRoomCards(shell).forEach(function (card) {
    card.visible = false;
  });
}

function getImageHash(node) {
  if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
  const imageFill = node.fills.find(function (fill) {
    return fill.type === "IMAGE" && fill.visible !== false && fill.imageHash;
  });
  return imageFill ? imageFill.imageHash : null;
}

function findProfileBackgroundNode(page) {
  const target = normalizeName(BG_IMAGE_NAME);
  const withImage = page.findAll(function (node) {
    return hasImageFill(node);
  });

  let match = withImage.find(function (node) {
    return normalizeName(node.name) === target;
  });
  if (match) return match;

  match = withImage.find(function (node) {
    return (
      node.name.indexOf("photo_2026-06-13_19-20-01") !== -1 &&
      node.name.indexOf("(2)") === -1
    );
  });
  return match || null;
}

function applyShellBackground(shell, imageHash) {
  removeNodesByName(shell, "Background photo");
  removeNodesByName(shell, "Background overlay");

  const bg = figma.createRectangle();
  bg.name = "Background photo";
  bg.resize(shell.width, shell.height);
  bg.x = 0;
  bg.y = 0;
  bg.fills = [{ type: "IMAGE", imageHash: imageHash, scaleMode: "FILL" }];
  shell.insertChild(0, bg);

  const overlay = figma.createRectangle();
  overlay.name = "Background overlay";
  overlay.resize(shell.width, shell.height);
  overlay.x = 0;
  overlay.y = 0;
  overlay.fills = solid("#061524", 0.42);
  shell.insertChild(1, overlay);
}

function mapTextTheme(node) {
  const style = String(node.fontName && node.fontName.style ? node.fontName.style : "Regular");
  const size = node.fontSize || 14;
  const name = normalizeName(node.name);
  const text = normalizeName(node.characters);

  if (
    style.indexOf("Bold") !== -1 ||
    size >= 20 ||
    name.indexOf("name") !== -1 ||
    name.indexOf("display") !== -1
  ) {
    return { weight: "Semi Bold", color: THEME.text, opacity: 1 };
  }

  if (
    name.indexOf("section") !== -1 ||
    (name.indexOf("title") !== -1 && size <= 16 && size >= 11)
  ) {
    return { weight: "Medium", color: THEME.accent, opacity: 0.95 };
  }

  if (
    size <= 13 ||
    name.indexOf("subtitle") !== -1 ||
    name.indexOf("caption") !== -1 ||
    name.indexOf("muted") !== -1 ||
    name.indexOf("secondary") !== -1 ||
    text.indexOf("member since") !== -1 ||
    text.indexOf("memory keeper") !== -1
  ) {
    return { weight: "Regular", color: THEME.muted, opacity: 0.92 };
  }

  if (style.indexOf("Medium") !== -1 || name.indexOf("label") !== -1 || name.indexOf("row") !== -1) {
    return { weight: "Medium", color: THEME.text, opacity: 0.96 };
  }

  return { weight: "Regular", color: THEME.text, opacity: 1 };
}

async function applyThemeTextStyles(root) {
  const textNodes = root.findAll(function (node) {
    return node.type === "TEXT";
  });

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    const mapped = mapTextTheme(node);
    await figma.loadFontAsync({ family: "Inter", style: mapped.weight });
    node.fontName = { family: "Inter", style: mapped.weight };
    node.fills = solid(mapped.color, mapped.opacity);
  }
}

function findAvatarNode(root) {
  const byName = root.findOne(function (node) {
    const name = normalizeName(node.name);
    return (
      name.indexOf("avatar") !== -1 ||
      name.indexOf("аватар") !== -1 ||
      (name.indexOf("photo") !== -1 && name.indexOf("photo_2026") === -1) ||
      name === "фото"
    );
  });
  if (byName) return byName;

  const imageNodes = root.findAll(function (node) {
    if (node.type !== "ELLIPSE" && node.type !== "RECTANGLE" && node.type !== "FRAME") {
      return false;
    }
    if (!hasImageFill(node)) return false;
    if (!("width" in node) || !("height" in node)) return false;
    return node.width >= 56 && node.width <= 120 && Math.abs(node.width - node.height) < 10;
  });

  imageNodes.sort(function (a, b) {
    return a.y - b.y;
  });

  return imageNodes[0] || null;
}

function findAvatarFrame(root) {
  const avatar = findAvatarNode(root);
  if (!avatar) return null;

  if (avatar.parent && avatar.parent.type === "FRAME") {
    const parent = avatar.parent;
    if (
      parent.width >= 56 &&
      parent.width <= 130 &&
      Math.abs(parent.width - parent.height) < 12
    ) {
      return parent;
    }
  }

  return avatar;
}

function highlightAvatarFrame(node) {
  if ("cornerRadius" in node && node.width > 0 && Math.abs(node.width - node.height) < 10) {
    node.cornerRadius = Math.round(node.width / 2);
  }

  if ("strokes" in node) {
    node.strokes = solid(THEME.line, 0.88);
    node.strokeWeight = 2;
  }

  node.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 1, g: 0.91, b: 0.72, a: 0.38 },
      offset: { x: 0, y: 0 },
      radius: 14,
      spread: 1,
      visible: true,
      blendMode: "NORMAL"
    },
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.18 },
      offset: { x: 0, y: 4 },
      radius: 8,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
}

function styleProfileContent(wrapper) {
  const avatar = findAvatarFrame(wrapper);
  if (avatar) highlightAvatarFrame(avatar);
  return !!avatar;
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

function getPrimarySolidFill(node) {
  if (!("fills" in node) || !Array.isArray(node.fills)) return null;
  return node.fills.find(function (fill) {
    return fill.type === "SOLID" && fill.visible !== false;
  });
}

function isBeigeFill(node) {
  const fill = getPrimarySolidFill(node);
  if (!fill) return false;

  const opacity = fill.opacity == null ? 1 : fill.opacity;
  if (opacity < 0.12) return false;

  const r = fill.color.r;
  const g = fill.color.g;
  const b = fill.color.b;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  if (lum < 0.52) return false;

  const warm = r >= g - 0.06 && g >= b - 0.1;
  const cream = lum >= 0.68 && r >= 0.72 && g >= 0.66;
  const sand = lum >= 0.55 && lum <= 0.9 && r - b >= 0.04;

  return warm && (cream || sand);
}

function hasTextDescendant(node) {
  return node.findAll(function (child) {
    return child.type === "TEXT";
  }).length > 0;
}

function clearFrameFills(node) {
  if ("fills" in node) node.fills = [];
}

function removeProfileBackgroundLayers(clone, shell) {
  clone.children.slice().forEach(function (child) {
    if (child.visible === false) return;
    if (!("width" in child) || !("height" in child)) return;

    const name = normalizeName(child.name);
    const coversWidth = child.width >= shell.width * 0.78;
    const coversHeight = child.height >= (shell.height - TAB_H) * 0.45;
    const isBackgroundName =
      name.indexOf("background") !== -1 || name.indexOf("bg") === 0 || name === "фон";

    if (hasImageFill(child) && coversWidth && child.height >= shell.height * 0.35) {
      child.remove();
      return;
    }

    if (isBackgroundName || (coversWidth && coversHeight)) {
      if (isBeigeFill(child) || isBackgroundName || !hasTextDescendant(child)) {
        child.remove();
      }
    }
  });

  clearFrameFills(clone);
}

function removeBeigeDecorativeShapes(root, keepIds) {
  const keep = keepIds || new Set();
  const removed = [];

  root.findAll(function (node) {
    if (keep.has(node.id)) return false;
    if (node.type !== "RECTANGLE" && node.type !== "FRAME") return false;
    if (hasImageFill(node)) return false;
    if (!isBeigeFill(node)) return false;
    if (hasTextDescendant(node)) return false;
    if (!("width" in node) || !("height" in node)) return false;
    if (node.width < 24 || node.height < 24) return false;
    return true;
  }).forEach(function (node) {
    removed.push(node);
  });

  removed.sort(function (a, b) {
    return b.width * b.height - a.width * a.height;
  });

  removed.forEach(function (node) {
    node.remove();
  });

  return removed.length;
}

function cleanupBeigeArtifacts(wrapper, shell) {
  const avatar = findAvatarFrame(wrapper);
  const keepIds = new Set();
  if (avatar) keepIds.add(avatar.id);

  const clone = wrapper.findOne(function (node) {
    return node.name === "My Profile content";
  });
  if (!clone) return 0;

  removeProfileBackgroundLayers(clone, shell);
  return removeBeigeDecorativeShapes(clone, keepIds);
}

function stripProfileChrome(root) {
  CHROME_NAMES.forEach(function (name) {
    removeNodesByName(root, name);
  });

  root.findAll(function (node) {
    return node.type === "TEXT" && node.name === "Screen title";
  }).forEach(function (node) {
    node.remove();
  });
}

function removeDuplicateBackground(clone, shell) {
  clone.children.slice().forEach(function (child) {
    if (child.visible === false) return;
    if (!("width" in child) || !("height" in child)) return;
    const coversShell =
      child.width >= shell.width * 0.92 &&
      child.height >= shell.height * 0.92 &&
      (hasImageFill(child) || normalizeName(child.name).indexOf("background") !== -1);
    if (coversShell) child.remove();
  });
}

function shiftCloneToTop(clone) {
  let minY = Infinity;
  let maxY = 0;

  clone.children.forEach(function (child) {
    if (child.visible === false) return;
    if (!("y" in child)) return;
    minY = Math.min(minY, child.y);
    const h = "height" in child ? child.height : 0;
    maxY = Math.max(maxY, child.y + h);
  });

  if (minY === Infinity) minY = 0;

  clone.children.forEach(function (child) {
    if ("y" in child) child.y -= minY;
  });

  return { minY: minY, contentHeight: Math.max(0, maxY - minY) };
}

function fitCloneWidth(clone, targetWidth) {
  if (Math.abs(clone.width - targetWidth) < 2) {
    clone.x = 0;
    return;
  }

  if (clone.width > targetWidth && typeof clone.rescale === "function") {
    clone.rescale(targetWidth / clone.width);
    clone.x = 0;
    return;
  }

  clone.x = Math.round((targetWidth - clone.width) / 2);
}

function addScrollCue(list, listH, contentH) {
  removeNodesByName(list, "Scroll track");
  removeNodesByName(list, "Scroll thumb");

  const track = figma.createRectangle();
  track.name = "Scroll track";
  track.resize(3, listH - 8);
  track.x = list.width - 6;
  track.y = 4;
  track.cornerRadius = 2;
  track.fills = solid(THEME.muted, 0.22);
  list.appendChild(track);

  const thumbH = Math.max(44, Math.round(listH * (listH / contentH)));
  const thumb = figma.createRectangle();
  thumb.name = "Scroll thumb";
  thumb.resize(3, thumbH);
  thumb.x = list.width - 6;
  thumb.y = 4;
  thumb.cornerRadius = 2;
  thumb.fills = solid(THEME.accent, 0.82);
  list.appendChild(thumb);
}

function importProfileContent(shell, source) {
  hideChambersContent(shell);

  const top = STATUS_H + NAV_H;
  const availH = shell.height - TAB_H - HOME_INDICATOR_H - top;

  const wrapper = figma.createFrame();
  wrapper.name = PROFILE_CONTENT_NAME;
  wrapper.resize(shell.width, availH);
  wrapper.x = 0;
  wrapper.y = top;
  wrapper.clipsContent = true;
  wrapper.fills = [];
  shell.appendChild(wrapper);

  const clone = source.clone();
  clone.name = "My Profile content";
  stripProfileChrome(clone);
  removeDuplicateBackground(clone, shell);
  removeProfileBackgroundLayers(clone, shell);
  removeBeigeDecorativeShapes(clone, new Set());

  const metrics = shiftCloneToTop(clone);
  fitCloneWidth(clone, shell.width);
  clone.y = 0;
  wrapper.appendChild(clone);

  if (metrics.contentHeight > availH + 8) {
    addScrollCue(wrapper, availH, metrics.contentHeight);
  }

  return { wrapper: wrapper, clone: clone };
}

async function patchProfileShell(shell, page, imageHash) {
  const source = findMyProfileSource(page, shell.id);
  if (!source) return { ok: false, reason: "source" };

  if (normalizeName(shell.name) !== "profile") {
    shell.name = "Profile";
  }

  if (imageHash) {
    applyShellBackground(shell, imageHash);
  }

  setNavTitle(shell, NAV_TITLE);
  updateTabBar(shell, PROFILE_TAB_INDEX);

  const imported = importProfileContent(shell, source);
  const beigeRemoved = cleanupBeigeArtifacts(imported.wrapper, shell);
  await applyThemeTextStyles(imported.wrapper);
  const avatarStyled = styleProfileContent(imported.wrapper);

  return {
    ok: true,
    sourceName: source.name,
    backgroundApplied: !!imageHash,
    avatarStyled: avatarStyled,
    beigeRemoved: beigeRemoved
  };
}

async function run() {
  await loadFonts();

  const page = figma.currentPage;
  const shell = findProfileMobileShell(page);

  if (!shell) {
    figma.closePlugin(
      'Mobile Profile frame not found. Expected "Profile" or "Profile - 1" with bottom navigation on this page.'
    );
    return;
  }

  const bgNode = findProfileBackgroundNode(page);
  const imageHash = getImageHash(bgNode);

  const result = await patchProfileShell(shell, page, imageHash);
  if (!result.ok) {
    figma.closePlugin(
      'My Profile source frame not found. Keep the standalone "My Profile" screen on the same page and run again.'
    );
    return;
  }

  figma.viewport.scrollAndZoomIntoView([shell]);

  const notes = [
    'Profile: nav title "' + NAV_TITLE + '", Profile tab active',
    'content from "' + result.sourceName + '"'
  ];
  if (result.backgroundApplied) {
    notes.push('background "' + BG_IMAGE_NAME + '"');
  } else {
    notes.push('background "' + BG_IMAGE_NAME + '" not found on page');
  }
  if (result.avatarStyled) {
    notes.push("avatar frame highlighted");
  }
  if (result.beigeRemoved) {
    notes.push("removed " + result.beigeRemoved + " beige shape(s)");
  }

  figma.closePlugin(notes.join(". ") + ".");
}

run().catch(function (err) {
  figma.closePlugin("Error: " + err.message);
});
