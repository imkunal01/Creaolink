const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.resolve(rootDir, "..", "uxp_premier_pro");
const outDir = path.resolve(rootDir, "public", "downloads");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Temporary directory for staging clean files
const stagingDir = path.resolve(outDir, "stage_plugin");
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

const filesToInclude = [
  "manifest.json",
  "index.html",
  "main.js",
  "timeline.js",
  "api.js",
  "storage.js",
  "styles.css"
];

filesToInclude.forEach((file) => {
  const src = path.join(sourceDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stagingDir, file));
  } else {
    console.warn(`Warning: File ${src} not found.`);
  }
});

const zipPath = path.join(outDir, "creaolink-premiere-plugin.zip");
const ccxPath = path.join(outDir, "creaolink-premiere-plugin.ccx");
const zipVerPath = path.join(outDir, "creaolink-premiere-v1.0.0.zip");
const ccxVerPath = path.join(outDir, "creaolink-premiere-v1.0.0.ccx");

[zipPath, ccxPath, zipVerPath, ccxVerPath].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
});

try {
  // Compress staging directory contents
  const psCommand = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPath}' -Force"`;
  execSync(psCommand, { stdio: "inherit" });

  fs.copyFileSync(zipPath, ccxPath);
  fs.copyFileSync(zipPath, zipVerPath);
  fs.copyFileSync(ccxPath, ccxVerPath);

  fs.rmSync(stagingDir, { recursive: true, force: true });
  console.log("Successfully packaged Premiere Pro UXP plugin:");
  console.log(" - public/downloads/creaolink-premiere-plugin.ccx");
  console.log(" - public/downloads/creaolink-premiere-plugin.zip");
  console.log(" - public/downloads/creaolink-premiere-v1.0.0.ccx");
  console.log(" - public/downloads/creaolink-premiere-v1.0.0.zip");
} catch (error) {
  console.error("Packaging failed:", error);
  process.exit(1);
}
