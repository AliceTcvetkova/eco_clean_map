/**
 * Embeds room PNGs and memory garden into code.js for Figma plugin.
 * Run: node embed-room-sources.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const templatePath = path.join(__dirname, "code.template.js");
const codePath = path.join(__dirname, "code.js");

const SOURCE_FILES = [
  {
    name: "image 1",
    file: path.join(root, "assets", "locus-chamber", "locus-chamber-library-vertical.png")
  },
  {
    name: "image 2",
    file: path.join(root, "assets", "locus-chamber", "shop-room.png")
  },
  {
    name: "image 3",
    file: path.join(root, "assets", "locus-chamber", "slide-06-castle-corridor.png")
  },
  {
    name: "image 4",
    file: path.join(root, "assets", "locus-chamber", "slide-07-living-room.png")
  },
  {
    name: "image 5",
    file: path.join(root, "assets", "locus-chamber", "locus-chamber-living-room-vertical.png")
  }
];

const MEMORY_GARDEN_FILE = path.join(
  root,
  "assets",
  "locus-chamber-memory-garden-mobile-bg.png"
);

const HOTSPOT_ICON_FILES = [
  {
    name: "photo_2026-06-13_19-19-59 1",
    file: path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-1.jpg")
  },
  {
    name: "photo_2026-06-13_19-19-59 (2) 1",
    file: path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-2.jpg")
  },
  {
    name: "photo_2026-06-13_19-20-00 (3) 1",
    file: path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-3.jpg")
  }
];

function pngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function imageDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return pngDimensions(filePath);
  }
  return { width: 480, height: 360 };
}

SOURCE_FILES.forEach(function (entry) {
  if (!fs.existsSync(entry.file)) {
    throw new Error("Missing source file: " + entry.file);
  }
});

HOTSPOT_ICON_FILES.forEach(function (entry) {
  if (!fs.existsSync(entry.file)) {
    throw new Error("Missing hotspot icon file: " + entry.file);
  }
});

if (!fs.existsSync(MEMORY_GARDEN_FILE)) {
  throw new Error("Missing memory garden file: " + MEMORY_GARDEN_FILE);
}

const roomSources = SOURCE_FILES.map(function (entry) {
  const dims = imageDimensions(entry.file);
  return {
    name: entry.name,
    width: dims.width,
    height: dims.height,
    base64: fs.readFileSync(entry.file).toString("base64")
  };
});

const memoryGardenBase64 = fs.readFileSync(MEMORY_GARDEN_FILE).toString("base64");

const hotspotIconSources = HOTSPOT_ICON_FILES.map(function (entry) {
  const dims = imageDimensions(entry.file);
  return {
    name: entry.name,
    width: dims.width,
    height: dims.height,
    base64: fs.readFileSync(entry.file).toString("base64")
  };
});

let code = fs.readFileSync(templatePath, "utf8");

function injectBetween(codeText, begin, end, serialized) {
  const start = codeText.indexOf(begin);
  const stop = codeText.indexOf(end);
  if (start === -1 || stop === -1) {
    throw new Error("Markers not found: " + begin);
  }
  return (
    codeText.slice(0, start + begin.length) +
    "\n" +
    serialized +
    "\n" +
    codeText.slice(stop)
  );
}

code = injectBetween(
  code,
  "/*HOTSPOT_ICON_SOURCES_BEGIN*/",
  "/*HOTSPOT_ICON_SOURCES_END*/",
  "const HOTSPOT_ICON_SOURCES = " + JSON.stringify(hotspotIconSources, null, 2) + ";"
);

code = injectBetween(
  code,
  "/*MEMORY_GARDEN_BEGIN*/",
  "/*MEMORY_GARDEN_END*/",
  'const MEMORY_GARDEN_BASE64 = "' + memoryGardenBase64 + '";'
);

code = injectBetween(
  code,
  "/*ROOM_SOURCES_BEGIN*/",
  "/*ROOM_SOURCES_END*/",
  "const ROOM_SOURCES = " + JSON.stringify(roomSources, null, 2) + ";"
);

fs.writeFileSync(codePath, code, "utf8");

roomSources.forEach(function (s, i) {
  console.log(SOURCE_FILES[i].name, s.width + "x" + s.height);
});
hotspotIconSources.forEach(function (s, i) {
  console.log("icon", i + 1, s.width + "x" + s.height);
});
console.log(
  "memory garden",
  Math.round(memoryGardenBase64.length / 1024) + " KB base64"
);
console.log(
  "Written",
  path.basename(codePath),
  Math.round(fs.statSync(codePath).size / 1024) + " KB"
);
