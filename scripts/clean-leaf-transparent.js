/** Remove baked checkerboard "transparency" from leaf info block PNG. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const src = path.join(root, "assets", "locus-chamber-leaf-info-block-transparent.png");
const bak = path.join(root, "assets", "locus-chamber-leaf-info-block-transparent.source.png");

function isBackgroundPixel(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (spread <= 24 && lum >= 168) return true;
  if (spread <= 18 && lum >= 150) return true;
  return false;
}

function isDarkBorderPixel(r, g, b, a) {
  if (a < 128) return false;
  return r <= 62 && g <= 62 && b <= 62;
}

function floodEdgeBackground(bgMask, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    if (bgMask[x]) queue.push([x, 0]);
    if (bgMask[(height - 1) * width + x]) queue.push([x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    if (bgMask[y * width]) queue.push([0, y]);
    if (bgMask[y * width + width - 1]) queue.push([width - 1, y]);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    if (!bgMask[idx]) continue;

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  bgMask.fill(0);
  for (let i = 0; i < visited.length; i++) {
    if (visited[i]) bgMask[i] = 1;
  }
}

function cropRegion(data, width, height, channels, minX, minY, maxX, maxY) {
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = Buffer.alloc(cropW * cropH * channels);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcI = ((y + minY) * width + (x + minX)) * channels;
      const dstI = (y * cropW + x) * channels;
      cropped[dstI] = data[srcI];
      cropped[dstI + 1] = data[srcI + 1];
      cropped[dstI + 2] = data[srcI + 2];
      cropped[dstI + 3] = data[srcI + 3];
    }
  }

  return { data: cropped, width: cropW, height: cropH };
}

function countDarkInRow(data, width, y, channels) {
  let count = 0;
  let minX = width;
  let maxX = 0;

  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    if (!isDarkBorderPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
    count++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }

  return { count, minX, maxX };
}

function countDarkInCol(data, width, height, x, channels) {
  let count = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    if (!isDarkBorderPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
    count++;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { count, minY, maxY };
}

function cropToDarkBorder(data, width, height, channels) {
  const minDarkInLine = 8;
  let minX = 0;
  let maxX = width - 1;
  let minY = 0;
  let maxY = height - 1;

  for (let y = 0; y < height; y++) {
    const row = countDarkInRow(data, width, y, channels);
    if (row.count >= minDarkInLine) {
      minY = y;
      break;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    const row = countDarkInRow(data, width, y, channels);
    if (row.count >= minDarkInLine) {
      maxY = y;
      break;
    }
  }

  for (let x = 0; x < width; x++) {
    const col = countDarkInCol(data, width, height, x, channels);
    if (col.count >= minDarkInLine) {
      minX = x;
      break;
    }
  }

  for (let x = width - 1; x >= 0; x--) {
    const col = countDarkInCol(data, width, height, x, channels);
    if (col.count >= minDarkInLine) {
      maxX = x;
      break;
    }
  }

  if (minX > maxX || minY > maxY) {
    return { data, width, height };
  }

  return cropRegion(data, width, height, channels, minX, minY, maxX, maxY);
}

async function main() {
  if (!fs.existsSync(bak) && fs.existsSync(src)) {
    fs.copyFileSync(src, bak);
  }
  if (!fs.existsSync(bak)) {
    console.error("Missing source backup:", bak);
    process.exit(1);
  }

  const { data, info } = await sharp(bak).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let { width, height, channels } = info;
  let changed = 0;

  const bgMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (isBackgroundPixel(data[i], data[i + 1], data[i + 2])) {
        bgMask[y * width + x] = 1;
      }
    }
  }

  floodEdgeBackground(bgMask, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!bgMask[y * width + x]) continue;
      const i = (y * width + x) * channels;
      if (data[i + 3] > 0) changed++;
      data[i + 3] = 0;
    }
  }

  const cropped = cropToDarkBorder(data, width, height, channels);
  width = cropped.width;
  height = cropped.height;

  const out = await sharp(cropped.data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(src, out);
  console.log(
    "Cleaned",
    changed,
    "background pixels; cropped to",
    width + "x" + height,
    "in",
    src
  );
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
