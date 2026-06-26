/**
 * Export demo frames for Locus Chamber video assembly.
 * Frame names + output filenames match scripts/locus-demo-sequence.json
 */
const FRAMES = [
  { name: "Login", file: "01-login.png" },
  { name: "Your Chambers 1", file: "02-your-chambers-1.png" },
  { name: "Your Chambers 2", file: "03-your-chambers-2.png" },
  { name: "App — Memory Garden (mobile)", file: "04-memory-garden.png" },
  { name: "App — Memory Garden — Files (mobile)", file: "05-memory-garden-files.png" },
  { name: "App — Memory Garden — Add file (mobile)", file: "06-memory-garden-add-file.png" },
  { name: "App — Memory Garden — Phone picker (mobile)", file: "07-memory-garden-phone-picker.png" },
  { name: "Chronology", file: "09-chronology.png" },
  { name: "App — Chronology — 2025 selected (mobile)", file: "10-chronology-2025.png" },
  { name: "App — Chronology — Photos (mobile)", file: "11-chronology-photos.png" },
  { name: "Create room - 1 ", file: "13-create-room-1.png" },
  { name: "Create room - 2 ", file: "14-create-room-2.png" },
  { name: "App — Living Room (mobile)", file: "15-living-room.png" },
  { name: "App — Living Room — Tap (mobile)", file: "16-living-room-tap.png" },
  { name: "App — Living Room — Area (mobile)", file: "17-living-room-area.png" },
  { name: "App — Living Room — File type (mobile)", file: "18-living-room-file-type.png" },
  { name: "App — Living Room — Upload (mobile)", file: "19-living-room-upload.png" },
  { name: "Archive - 1", file: "20-archive-1.png" },
  { name: "Archive - 2", file: "21-archive-2.png" },
  { name: "Archive - 3", file: "22-archive-3.png" },
  { name: "Profile", file: "23-profile.png" }
];

const ALT_NAMES = {
  "Your Chambers 1": ["Your Chambers"],
  "Create room - 1 ": ["Create room - 1", "Create room"],
  "Create room - 2 ": ["Create room - 2"]
};

function normalizeName(name) {
  return String(name || "")
    .replace(/\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findFrame(page, spec) {
  const wanted = [spec.name].concat(ALT_NAMES[spec.name] || []);
  const wantedNorm = wanted.map(normalizeName);

  for (const node of page.findAll((n) => n.type === "FRAME")) {
    const nn = normalizeName(node.name);
    if (wantedNorm.indexOf(nn) !== -1) return node;
  }
  return null;
}

figma.showUI(__html__, { width: 420, height: 320 });

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "export") return;

  try {
    const page = figma.currentPage;
    figma.ui.postMessage({ type: "start", count: FRAMES.length });

    for (const spec of FRAMES) {
      const frame = findFrame(page, spec);
      if (!frame) {
        figma.ui.postMessage({ type: "error", text: 'Frame not found: "' + spec.name + '"' });
        return;
      }

      figma.ui.postMessage({ type: "log", text: "Exporting " + spec.file + " …" });
      const bytes = await frame.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 }
      });

      figma.ui.postMessage({
        type: "file",
        fileName: spec.file,
        bytes: Array.from(bytes)
      });
    }

    figma.ui.postMessage({ type: "log", text: "Queued " + FRAMES.length + " downloads." });
  } catch (err) {
    figma.ui.postMessage({ type: "error", text: err.message || String(err) });
  }
};
