/**
 * Assemble Locus Chamber click-through demo video from exported Figma PNGs + screen recordings.
 *
 * Variant groups (same screen + overlay) are merged with a soft crossfade.
 * Other transitions are hard cuts.
 *
 * Usage:
 *   node scripts/assemble-locus-demo.mjs [frames-dir]
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sequencePath = path.join(__dirname, "locus-demo-sequence.json");
const defaultExportDir = path.join(root, "assets", "locus-chamber", "demo-export");
const exportDir = path.resolve(process.argv[2] || process.env.LOCUS_FRAMES_DIR || defaultExportDir);
const tmpDir = path.join(__dirname, ".assemble-tmp");
const outputFile = path.join(
  process.env.USERPROFILE || "",
  "Downloads",
  "Locus-Chamber-demo.mp4"
);

const sequence = JSON.parse(fs.readFileSync(sequencePath, "utf8"));
const {
  width,
  height,
  fps,
  screenDurationSec,
  variantCrossfadeSec = 0.55,
  background
} = sequence.output;
const bg = background || "#0a0a0a";

function run(cmd, args, quiet) {
  const result = spawnSync(cmd, args, {
    stdio: quiet ? "pipe" : "inherit",
    shell: false,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "";
    throw new Error(cmd + " failed: " + args.join(" ") + (err ? "\n" + err : ""));
  }
  return result.stdout;
}

function vfScalePad() {
  return (
    "scale=" +
    width +
    ":" +
    height +
    ":force_original_aspect_ratio=decrease," +
    "pad=" +
    width +
    ":" +
    height +
    ":(ow-iw)/2:(oh-ih)/2:color=" +
    bg +
    ",fps=" +
    fps +
    ",format=yuv420p,setsar=1"
  );
}

function encodeVideoArgs(outFile) {
  return [
    "-an",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-vsync",
    "cfr",
    "-movflags",
    "+faststart",
    outFile
  ];
}

function resolveInput(item) {
  if (item.type === "video") {
    if (!fs.existsSync(item.file)) throw new Error("Video not found: " + item.file);
    return item.file;
  }
  const png = path.join(exportDir, item.file);
  if (!fs.existsSync(png)) {
    throw new Error('Missing PNG "' + item.file + '" for ' + item.name + ".");
  }
  return png;
}

function clipPath(index) {
  return path.join(tmpDir, String(index).padStart(2, "0") + ".mp4");
}

function segmentPath(index) {
  return path.join(tmpDir, "seg-" + String(index).padStart(2, "0") + ".mp4");
}

function probeDuration(file) {
  const out = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file
    ],
    true
  );
  return parseFloat(out.trim());
}

function buildClip(index, item) {
  const out = clipPath(index);
  const input = resolveInput(item);

  if (item.type === "video") {
    const args = ["-y", "-i", input];
    if (item.durationSec) args.push("-t", String(item.durationSec));
    args.push("-vf", vfScalePad());
    args.push(...encodeVideoArgs(out));
    run("ffmpeg", args);
    return;
  }

  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    input,
    "-t",
    String(screenDurationSec),
    "-vf",
    vfScalePad(),
    ...encodeVideoArgs(out)
  ]);
}

function splitSegments(items) {
  const segments = [];
  let current = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const group = item.variantGroup || null;
    const prev = i > 0 ? items[i - 1] : null;
    const prevGroup = prev ? prev.variantGroup || null : null;

    if (current.length && group !== prevGroup) {
      segments.push(current);
      current = [];
    }

    current.push({ index: i, item, group });
  }

  if (current.length) segments.push(current);
  return segments;
}

function mergeWithCrossfade(clipFiles, fadeSec, outFile) {
  if (clipFiles.length === 1) {
    fs.copyFileSync(clipFiles[0], outFile);
    return;
  }

  const durations = clipFiles.map(probeDuration);
  const args = ["-y"];
  clipFiles.forEach((file) => {
    args.push("-i", file);
  });

  const filters = [];
  let offset = durations[0] - fadeSec;
  let prev = "[0:v]";

  for (let i = 1; i < clipFiles.length; i++) {
    const label = i === clipFiles.length - 1 ? "vx" : "v" + i;
    filters.push(
      prev +
        "[" +
        i +
        ":v]xfade=transition=fade:duration=" +
        fadeSec +
        ":offset=" +
        offset.toFixed(3) +
        "[" +
        label +
        "]"
    );
    prev = "[" + label + "]";
    if (i < clipFiles.length - 1) {
      offset += durations[i] - fadeSec;
    }
  }

  filters.push(prev + "fps=" + fps + ",format=yuv420p,setsar=1[vout]");

  args.push("-filter_complex", filters.join(";"), "-map", "[vout]", ...encodeVideoArgs(outFile));

  run("ffmpeg", args);
}

function concatSegments(segmentFiles) {
  const listFile = path.join(tmpDir, "concat.txt");
  const lines = segmentFiles.map((file) => "file '" + file.replace(/\\/g, "/") + "'");
  fs.writeFileSync(listFile, lines.join("\n"));

  run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-fflags",
    "+genpts",
    "-i",
    listFile,
    "-vf",
    "fps=" + fps + ",format=yuv420p,setsar=1",
    ...encodeVideoArgs(outputFile)
  ]);
}

function main() {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(exportDir, { recursive: true });

  const items = sequence.items;
  console.log("Frames:", exportDir);
  console.log("Variant crossfade:", variantCrossfadeSec + "s");
  console.log("Building", items.length, "clips →", outputFile);

  for (let i = 0; i < items.length; i++) {
    console.log("[" + (i + 1) + "/" + items.length + "]", items[i].name);
    buildClip(i, items[i]);
  }

  const segments = splitSegments(items);
  const segmentFiles = [];

  console.log("\nMerging", segments.length, "segments…");
  segments.forEach((segment, segIndex) => {
    const clipFiles = segment.map((entry) => clipPath(entry.index));
    const out = segmentPath(segIndex);
    const useCrossfade = segment.length > 1 && segment[0].group;

    if (useCrossfade) {
      console.log(
        "  seg " + (segIndex + 1) + ": crossfade ×" + segment.length + " (" + segment[0].group + ")"
      );
      mergeWithCrossfade(clipFiles, variantCrossfadeSec, out);
    } else {
      console.log("  seg " + (segIndex + 1) + ": cut ×" + segment.length);
      if (segment.length === 1) {
        fs.copyFileSync(clipFiles[0], out);
      } else {
        mergeWithCrossfade(clipFiles, 0.001, out);
      }
    }

    segmentFiles.push(out);
  });

  concatSegments(segmentFiles);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("\nSaved:", outputFile);
}

main();
