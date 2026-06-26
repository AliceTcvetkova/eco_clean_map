/**
 * Embeds room source images into code.js
 * Run: node embed.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
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
    file: path.join(
      root,
      "assets",
      "locus-chamber",
      "discovery",
      "mvp-room-scrapbook.png"
    )
  }
];

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
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return { width: 480, height: 360 };
}

const roomSources = SOURCE_FILES.map(function (entry) {
  if (!fs.existsSync(entry.file)) {
    throw new Error("Missing: " + entry.file);
  }
  const dims = imageDimensions(entry.file);
  return {
    name: entry.name,
    width: dims.width,
    height: dims.height,
    base64: fs.readFileSync(entry.file).toString("base64")
  };
});

const serialized = "const ROOM_SOURCES = " + JSON.stringify(roomSources, null, 2) + ";";

let code = fs.readFileSync(codePath, "utf8");
const begin = "/*ROOM_SOURCES_BEGIN*/";
const end = "/*ROOM_SOURCES_END*/";
const start = code.indexOf(begin);
const stop = code.indexOf(end);

if (start === -1 || stop === -1) {
  throw new Error("ROOM_SOURCES markers not found");
}

code =
  code.slice(0, start + begin.length) +
  "\n" +
  serialized +
  "\n" +
  code.slice(stop);

fs.writeFileSync(codePath, code, "utf8");
roomSources.forEach(function (s, i) {
  console.log(SOURCE_FILES[i].name, s.width + "x" + s.height);
});
console.log("Written", Math.round(fs.statSync(codePath).size / 1024), "KB");
