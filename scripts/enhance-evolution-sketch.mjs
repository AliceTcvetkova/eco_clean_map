import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const src =
  "C:/Users/Alice/.cursor/projects/d-eco-clean-map-eco-clean-map/assets/c__Users_Alice_AppData_Roaming_Cursor_User_workspaceStorage_cfc785182f48ff1e0133066f1f8fff21_images_photo_2026-06-13_18-40-06-b5197362-fae8-440f-bdfe-11f0e43776af.png";

const out = path.join(root, "assets/locus-chamber/evolution/hand-drawn-concepts.jpg");

await sharp(src)
  .rotate(-90)
  .trim({ threshold: 12 })
  .modulate({ brightness: 1.06, saturation: 0.82 })
  .linear(1.12, -(128 * 0.08))
  .median(3)
  .sharpen({ sigma: 1.05, m1: 0.85, m2: 0.35 })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(out);

const meta = await sharp(out).metadata();
console.log("Saved:", out, `${meta.width}x${meta.height}`);
