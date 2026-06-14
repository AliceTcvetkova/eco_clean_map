import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const dictParts = fs.readFileSync(path.join(root, "js/i18n/dict-ru.js"), "utf8");
const attrDict = fs.readFileSync(path.join(root, "js/i18n/dict-ru-attrs.js"), "utf8");

function extractKeys(source) {
  const keys = [];
  const re = /"((?:\\.|[^"\\])*)"\s*:/g;
  let m;
  while ((m = re.exec(source))) keys.push(m[1]);
  return keys;
}

const textSet = new Set(extractKeys(dictParts));
const attrSet = new Set(extractKeys(attrDict));
const missing = [];

for (const f of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const html = fs
    .readFileSync(path.join(root, f), "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "");

  html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach((t) => {
      if (t.length < 800 && !textSet.has(t)) missing.push({ f, type: "text", v: t.slice(0, 100) });
    });

  for (const attr of ["alt", "aria-label", "title"]) {
    const re = new RegExp(attr + '="([^"]*)"', "gi");
    let m;
    while ((m = re.exec(html))) {
      const v = m[1];
      if (v && !attrSet.has(v)) missing.push({ f, type: attr, v: v.slice(0, 100) });
    }
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1].trim() && !attrSet.has(titleMatch[1].trim())) {
    missing.push({ f, type: "title", v: titleMatch[1].trim() });
  }

  const metaMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  if (metaMatch && metaMatch[1] && !attrSet.has(metaMatch[1])) {
    missing.push({ f, type: "meta", v: metaMatch[1].slice(0, 100) });
  }
}

console.log("missing:", missing.length);
missing.slice(0, 40).forEach((m) => console.log(m));
