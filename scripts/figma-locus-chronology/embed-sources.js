/**
 * Embeds Chronology screen images into code.js.
 * Run: node embed-sources.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

execSync('node "' + path.join(__dirname, "..", "clean-leaf-transparent.js") + '"', {
  stdio: "inherit"
});

const root = path.join(__dirname, "..", "..");
const templatePath = path.join(__dirname, "code.template.js");
const codePath = path.join(__dirname, "code.js");

const BACKGROUND_FILE = path.join(
  root,
  "assets",
  "locus-chamber-vertical-branch-background-gold-narrow.png"
);
const LEAF_FILE = path.join(root, "assets", "locus-chamber-leaf-info-block-transparent.png");

const ICON_FILES = [
  path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-1.jpg"),
  path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-2.jpg"),
  path.join(root, "assets", "locus-chamber", "hotspot-icons", "icon-3.jpg")
];

[BACKGROUND_FILE, LEAF_FILE].concat(ICON_FILES).forEach(function (file) {
  if (!fs.existsSync(file)) {
    throw new Error("Missing file: " + file);
  }
});

const backgroundBase64 = fs.readFileSync(BACKGROUND_FILE).toString("base64");
const leafBase64 = fs.readFileSync(LEAF_FILE).toString("base64");
const iconSources = ICON_FILES.map(function (file) {
  return { base64: fs.readFileSync(file).toString("base64") };
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
  "/*BACKGROUND_BEGIN*/",
  "/*BACKGROUND_END*/",
  'const BACKGROUND_BASE64 = "' + backgroundBase64 + '";'
);

code = injectBetween(
  code,
  "/*LEAF_BEGIN*/",
  "/*LEAF_END*/",
  'const LEAF_BASE64 = "' + leafBase64 + '";'
);

code = injectBetween(
  code,
  "/*ICON_SOURCES_BEGIN*/",
  "/*ICON_SOURCES_END*/",
  "const ICON_SOURCES = " + JSON.stringify(iconSources) + ";"
);

fs.writeFileSync(codePath, code, "utf8");
console.log("Written", path.basename(codePath), Math.round(fs.statSync(codePath).size / 1024) + " KB");
