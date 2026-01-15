/**
 * Seed projects by downloading the Obuntu pilot data bundle and running imports.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as http from "http";
import * as https from "https";
import { spawnSync } from "child_process";

const OBUNTU_PILOT_URL = process.env.OBUNTU_PILOT_URL;
const CACHE_ROOT = path.join(process.cwd(), ".cache", "obuntu-pilot-project");
const ARCHIVE_PATH = path.join(CACHE_ROOT, "obuntu-pilot-project.zip");
const EXTRACT_DIR = path.join(CACHE_ROOT, "extracted");

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function downloadToFile(urlString: string, destPath: string, redirectsLeft = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === "http:" ? http : https;

    const request = client.get(url, (response) => {
      const status = response.statusCode || 0;
      const location = response.headers.location;

      if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
        response.resume();
        return resolve(downloadToFile(location, destPath, redirectsLeft - 1));
      }

      if (status < 200 || status >= 300) {
        response.resume();
        return reject(new Error(`Download failed with status ${status}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", (error) => {
        fs.unlink(destPath, () => reject(error));
      });
    });

    request.on("error", reject);
  });
}

function unzipArchive(archivePath: string, destination: string) {
  const result = spawnSync("unzip", ["-q", "-o", archivePath, "-d", destination], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Failed to unzip archive. Ensure `unzip` is available.");
  }
}

function findPilotProjectDir(extractRoot: string): string {
  const directRawData = path.join(extractRoot, "raw-data");
  if (fs.existsSync(directRawData)) {
    return extractRoot;
  }

  const entries = fs.readdirSync(extractRoot, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  for (const dirName of dirs) {
    const candidate = path.join(extractRoot, dirName);
    if (fs.existsSync(path.join(candidate, "raw-data"))) {
      return candidate;
    }
  }

  throw new Error("Could not find `raw-data` in extracted archive.");
}

function runImport(scriptPath: string, pilotProjectDir: string) {
  const tsxPath = path.join(process.cwd(), "node_modules", ".bin", "tsx");
  const env = {
    ...process.env,
    PILOT_PROJECT_DIR: pilotProjectDir,
  };

  const result = spawnSync(tsxPath, [scriptPath], { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(`Import failed: ${scriptPath}`);
  }
}

async function main() {
  if (!OBUNTU_PILOT_URL) {
    console.error("Missing OBUNTU_PILOT_URL. See README for setup.");
    process.exit(1);
  }

  ensureDir(CACHE_ROOT);

  console.log("⬇️  Downloading Obuntu pilot data...");
  await downloadToFile(OBUNTU_PILOT_URL, ARCHIVE_PATH);

  console.log("🧹 Preparing extraction directory...");
  fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
  ensureDir(EXTRACT_DIR);

  console.log("📦 Extracting archive...");
  unzipArchive(ARCHIVE_PATH, EXTRACT_DIR);

  const pilotProjectDir = findPilotProjectDir(EXTRACT_DIR);
  console.log(`✅ Using pilot project data at: ${pilotProjectDir}`);

  console.log("🚀 Running imports...");
  runImport("scripts/import-nv-mapping.ts", pilotProjectDir);
  runImport("scripts/import-landstewards.ts", pilotProjectDir);
  runImport("scripts/import-obuntu-resets.ts", pilotProjectDir);

  console.log("✅ Seed complete.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

