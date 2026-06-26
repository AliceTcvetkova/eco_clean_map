/**
 * Export Locus Chamber demo frames from Figma REST API.
 *
 * Requires FIGMA_ACCESS_TOKEN (Personal access token from Figma → Settings → Security).
 *
 * Usage:
 *   set FIGMA_ACCESS_TOKEN=figd_...
 *   node scripts/export-locus-figma-frames.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sequencePath = path.join(__dirname, "locus-demo-sequence.json");
const exportDir = path.join(root, "assets", "locus-chamber", "demo-export");

const FILE_KEY = "Y9zEWrf1NmjYK0ZYYRXEGz";
const SCALE = 2;

const token = process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error("Set FIGMA_ACCESS_TOKEN (Figma → Settings → Security → Personal access tokens).");
  process.exit(1);
}

const sequence = JSON.parse(fs.readFileSync(sequencePath, "utf8"));
const frames = sequence.items.filter((item) => item.type === "frame");

function encodeNodeId(nodeId) {
  return nodeId.replace(":", "-");
}

async function figmaImages(nodeIds) {
  const ids = nodeIds.join(",");
  const url =
    "https://api.figma.com/v1/images/" +
    FILE_KEY +
    "?ids=" +
    encodeURIComponent(ids) +
    "&format=png&scale=" +
    SCALE;

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token }
  });

  if (!res.ok) {
    throw new Error("Figma images API " + res.status + ": " + (await res.text()));
  }

  const data = await res.json();
  if (data.err) throw new Error(data.err);
  return data.images;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed " + res.status + " → " + dest);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(exportDir, { recursive: true });

  const batchSize = 10;
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);
    const nodeIds = batch.map((f) => f.nodeId);
    const images = await figmaImages(nodeIds);

    for (const frame of batch) {
      const imageUrl = images[frame.nodeId];
      if (!imageUrl) {
        throw new Error('No export URL for "' + frame.name + '" (' + frame.nodeId + ")");
      }
      const dest = path.join(exportDir, frame.file);
      await download(imageUrl, dest);
      console.log("Saved", frame.file);
    }
  }

  console.log("\nDone:", exportDir);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
