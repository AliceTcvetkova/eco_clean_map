/** Remove baked UI hotspot rectangles from memory garden room art. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "assets", "locus-chamber-memory-garden-room.png");
const bak = path.join(root, "assets", "locus-chamber-memory-garden-room.source.png");

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isOverlayPixel(r, g, b) {
  if (Math.max(r, g, b) - Math.min(r, g, b) > 55) return false;
  const lum = luminance(r, g, b);
  if (lum < 155) return false;
  return r > 145 && g > 135 && b > 115 && lum < 245;
}

async function main() {
  if (!fs.existsSync(src)) {
    console.error("Missing", src);
    process.exit(1);
  }

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(src, bak);
  }

  const { data, info } = await sharp(bak).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const mask = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * channels;
      if (isOverlayPixel(data[i], data[i + 1], data[i + 2])) {
        mask[y * w + x] = 1;
      }
    }
  }

  const dilated = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            dilated[ny * w + nx] = 1;
          }
        }
      }
    }
  }

  let changed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dilated[y * w + x]) continue;
      const samples = [];
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
          if (dilated[ny * w + nx]) continue;
          const si = (ny * w + nx) * channels;
          samples.push([data[si], data[si + 1], data[si + 2]]);
        }
      }
      if (!samples.length) continue;
      const i = (y * w + x) * channels;
      data[i] = Math.round(samples.reduce((s, c) => s + c[0], 0) / samples.length);
      data[i + 1] = Math.round(samples.reduce((s, c) => s + c[1], 0) / samples.length);
      data[i + 2] = Math.round(samples.reduce((s, c) => s + c[2], 0) / samples.length);
      changed++;
    }
  }

  await sharp(data, { raw: { width: w, height: h, channels } })
    .blur(0.35)
    .png({ compressionLevel: 9 })
    .toFile(src);

  console.log("Cleaned", changed, "overlay pixels in", src);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
