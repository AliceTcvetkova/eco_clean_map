import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const src =
  "C:/Users/Alice/.cursor/projects/d-eco-clean-map-eco-clean-map/assets/c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-06_01-42-0555-caa39133-bdce-4e66-8a44-471e0c6b9032.png";

const out = path.join(root, "assets/locus-chamber/discovery/insights-searching.png");

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

const crop = {
  left: Math.round(w * 0.035),
  top: Math.round(h * 0.02),
  width: Math.round(w * 0.345),
  height: Math.round(h * 0.94)
};

function lum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isOutline(r, g, b) {
  return lum(r, g, b) < 58;
}

function isParchment(r, g, b) {
  return (
    r > 178 &&
    g > 160 &&
    b > 112 &&
    r - b > 34 &&
    r - b < 98 &&
    g - b > 10 &&
    r >= g - 8
  );
}

function isBubbleFill(r, g, b) {
  const l = lum(r, g, b);
  return l > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 30;
}

function isGround(r, g, b, y, height) {
  return r < 58 && g < 48 && b < 42 && y > height * 0.84;
}

function idx(x, y, width) {
  return y * width + x;
}

function isHairish(r, g, b) {
  return (
    r > 115 &&
    r < 215 &&
    g > 95 &&
    g < 185 &&
    b > 55 &&
    b < 145 &&
    r - g > 8 &&
    g - b > 8
  );
}

function sampleHair(data, width, height, channels) {
  const points = [];
  for (let py = 0.11; py <= 0.18; py += 0.02) {
    for (let px = 0.24; px <= 0.4; px += 0.03) {
      points.push([px, py]);
    }
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [px, py] of points) {
    const x = Math.round(width * px);
    const y = Math.round(height * py);
    const i = (y * width + x) * channels;
    if (data[i + 3] < 128 || isOutline(data[i], data[i + 1], data[i + 2])) continue;
    if (!isHairish(data[i], data[i + 1], data[i + 2])) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (!count) return { r: 176, g: 142, b: 98 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

function floodBackground(data, width, height, channels) {
  const outside = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) {
    stack.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    stack.push([0, y], [width - 1, y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    const id = idx(x, y, width);
    if (x < 0 || y < 0 || x >= width || y >= height || outside[id]) continue;
    const i = id * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isOutline(r, g, b)) continue;
    if (!isParchment(r, g, b) && !isBubbleFill(r, g, b) && !isGround(r, g, b, y, height)) continue;
    outside[id] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = idx(x, y, width);
      const i = id * channels;
      let alpha = outside[id] ? 0 : 255;
      if (alpha && isBubbleFill(data[i], data[i + 1], data[i + 2])) alpha = 0;
      data[i + 3] = alpha;
    }
  }
}

function cutThoughtBubble(data, width, height, channels) {
  const top = Math.round(height * 0.24);
  for (let y = 0; y < top; y++) {
    for (let x = 0; x < width; x++) {
      const inBubbleZone = y < height * 0.21 && x > width * 0.32;
      const inTailZone =
        y < height * 0.2 &&
        y > height * 0.04 &&
        x > width * 0.36 &&
        x < width * 0.76;
      if (!inBubbleZone && !inTailZone) continue;
      const i = idx(x, y, width) * channels;
      data[i + 3] = 0;
    }
  }
}

function removeGroundBar(data, width, height, channels) {
  const floorY = Math.round(height * 0.855);
  for (let y = floorY; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (lum(r, g, b) < 95) {
        data[i + 3] = 0;
      }
    }
  }
}

function cleanTopFringe(data, width, height, channels) {
  const top = Math.round(height * 0.19);
  for (let y = 0; y < top; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width) * channels;
      if (data[i + 3] < 128) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isOutline(r, g, b) || isBubbleFill(r, g, b)) {
        data[i + 3] = 0;
      }
    }
  }
}

function keepLargestComponent(data, width, height, channels) {
  const opaque = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width) * channels;
      opaque[idx(x, y, width)] = data[i + 3] > 127 ? 1 : 0;
    }
  }

  const visited = new Uint8Array(width * height);
  let best = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = idx(x, y, width);
      if (!opaque[start] || visited[start]) continue;
      const stack = [[x, y]];
      const pixels = [];
      visited[start] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        pixels.push([cx, cy]);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nid = idx(nx, ny, width);
          if (!opaque[nid] || visited[nid]) continue;
          visited[nid] = 1;
          stack.push([nx, ny]);
        }
      }
      if (!best || pixels.length > best.length) best = pixels;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[idx(x, y, width) * channels + 3] = 0;
    }
  }
  for (const [x, y] of best) {
    data[idx(x, y, width) * channels + 3] = 255;
  }
}

function fillInteriorHoles(data, width, height, channels, passes = 80) {
  for (let pass = 0; pass < passes; pass++) {
    let changed = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const id = idx(x, y, width);
        const i = id * channels;
        if (data[i + 3] > 127) continue;
        let neighbors = 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        for (const [nx, ny] of [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
          [x + 1, y + 1],
          [x - 1, y - 1],
          [x + 1, y - 1],
          [x - 1, y + 1]
        ]) {
          const ni = idx(nx, ny, width) * channels;
          if (data[ni + 3] > 127 && !isOutline(data[ni], data[ni + 1], data[ni + 2])) {
            neighbors++;
            sr += data[ni];
            sg += data[ni + 1];
            sb += data[ni + 2];
          }
        }
        if (neighbors >= 4) {
          data[i] = Math.round(sr / neighbors);
          data[i + 1] = Math.round(sg / neighbors);
          data[i + 2] = Math.round(sb / neighbors);
          data[i + 3] = 255;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
}

function smoothInteriorOutlines(data, width, height, channels) {
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const i = idx(x, y, width) * channels;
      if (data[i + 3] < 128 || !isOutline(data[i], data[i + 1], data[i + 2])) continue;
      let fillNeighbors = 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ]) {
        const ni = idx(nx, ny, width) * channels;
        if (data[ni + 3] > 127 && !isOutline(data[ni], data[ni + 1], data[ni + 2])) {
          fillNeighbors++;
          sr += data[ni];
          sg += data[ni + 1];
          sb += data[ni + 2];
        }
      }
      if (fillNeighbors >= 3) {
        data[i] = Math.round(sr / fillNeighbors);
        data[i + 1] = Math.round(sg / fillNeighbors);
        data[i + 2] = Math.round(sb / fillNeighbors);
      }
    }
  }
}

function mirrorHairTop(data, width, height, channels) {
  const y0 = Math.round(height * 0.11);
  const y1 = Math.round(height * 0.2);
  const x0 = Math.round(width * 0.46);
  const x1 = Math.round(width * 0.64);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = idx(x, y, width) * channels;
      if (data[i + 3] > 127) continue;
      const srcX = Math.round(width * 0.4 - (x - x0) * 0.55);
      if (srcX < Math.round(width * 0.18)) continue;
      const si = idx(srcX, y, width) * channels;
      if (data[si + 3] < 128 || isOutline(data[si], data[si + 1], data[si + 2])) continue;
      data[i] = data[si];
      data[i + 1] = data[si + 1];
      data[i + 2] = data[si + 2];
      data[i + 3] = 255;
    }
  }
}

function removeBubbleTailOutlines(data, width, height, channels) {
  for (let y = 0; y < Math.round(height * 0.22); y++) {
    const xStart =
      y < height * 0.11
        ? Math.round(width * 0.4)
        : y < height * 0.17
          ? Math.round(width * 0.47)
          : Math.round(width * 0.52);
    for (let x = xStart; x < width; x++) {
      const i = idx(x, y, width) * channels;
      if (data[i + 3] < 128) continue;
      if (isOutline(data[i], data[i + 1], data[i + 2]) || isBubbleFill(data[i], data[i + 1], data[i + 2])) {
        data[i + 3] = 0;
      }
    }
  }
}

function restoreHeadGaps(data, width, height, channels) {
  const yMax = Math.round(height * 0.24);
  const xMin = Math.round(width * 0.18);
  const xMax = Math.round(width * 0.76);

  for (let pass = 0; pass < 60; pass++) {
    let changed = false;
    for (let y = 1; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        const i = idx(x, y, width) * channels;
        if (data[i + 3] > 127) continue;
        for (const [nx, ny] of [
          [x, y + 1],
          [x, y + 2],
          [x - 1, y + 1],
          [x + 1, y + 1],
          [x - 1, y],
          [x + 1, y],
          [x, y - 1]
        ]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = idx(nx, ny, width) * channels;
          if (data[ni + 3] < 128 || isOutline(data[ni], data[ni + 1], data[ni + 2])) continue;
          data[i] = data[ni];
          data[i + 1] = data[ni + 1];
          data[i + 2] = data[ni + 2];
          data[i + 3] = 255;
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }
}

const scale = 4;
const { data, info } = await sharp(src)
  .extract(crop)
  .resize(crop.width * scale, crop.height * scale, {
    kernel: sharp.kernel.lanczos3
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

floodBackground(data, info.width, info.height, info.channels);
cutThoughtBubble(data, info.width, info.height, info.channels);
removeGroundBar(data, info.width, info.height, info.channels);
keepLargestComponent(data, info.width, info.height, info.channels);
fillInteriorHoles(data, info.width, info.height, info.channels);
smoothInteriorOutlines(data, info.width, info.height, info.channels);
removeBubbleTailOutlines(data, info.width, info.height, info.channels);
restoreHeadGaps(data, info.width, info.height, info.channels);
mirrorHairTop(data, info.width, info.height, info.channels);
cleanTopFringe(data, info.width, info.height, info.channels);
removeBubbleTailOutlines(data, info.width, info.height, info.channels);
restoreHeadGaps(data, info.width, info.height, info.channels);
mirrorHairTop(data, info.width, info.height, info.channels);
fillInteriorHoles(data, info.width, info.height, info.channels, 40);

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4
  }
})
  .trim({ threshold: 1 })
  .median(3)
  .sharpen({ sigma: 0.85, m1: 0.7, m2: 0.25 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(out);

const trimmed = await sharp(out).metadata();
console.log("Saved:", out, `${trimmed.width}x${trimmed.height}`);
