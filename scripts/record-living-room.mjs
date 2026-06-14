import { chromium } from "playwright";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const downloadsDir = path.join(process.env.USERPROFILE || "", "Downloads");
const outputFile = path.join(downloadsDir, "Locus-Chamber-living-room-demo.webm");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml"
};

function startServer(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const rel = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = path.normalize(path.join(dir, rel.replace(/^\//, "")));
      if (!filePath.startsWith(dir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function main() {
  const { server, port } = await startServer(rootDir);
  const pageUrl = `http://127.0.0.1:${port}/locus-chamber.html`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: path.join(rootDir, "scripts", ".record-tmp"),
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();

  await page.route("**/locus-chamber-player.js*", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "renderScene(config.start, false);",
      'renderScene("app-living-room", false);'
    );
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body
    });
  });

  await page.goto(pageUrl, { waitUntil: "networkidle" });

  await page.addStyleTag({
    content: `
      .site-header,
      .site-footer,
      .locus-intro,
      .locus-section-nav { display: none !important; }
      .locus-main { margin-top: 0 !important; padding-top: 0 !important; }
      body.locus-page { padding-top: 0 !important; }
    `
  });

  await page.waitForSelector(".locus-app-room--play", { timeout: 15000 });
  await page.waitForSelector(".locus-cat-folder--open", { timeout: 15000 });
  await page.waitForTimeout(1200);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();
  server.close();

  const recordedPath = await video.path();
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  fs.copyFileSync(recordedPath, outputFile);
  fs.rmSync(path.dirname(recordedPath), { recursive: true, force: true });

  console.log("Saved:", outputFile);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
