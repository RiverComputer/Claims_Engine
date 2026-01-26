import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { basename, extname, join, resolve } from "path";
import { storeFile } from "../lib/storage/file-store";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
]);

type MediaEntry = {
  filename: string;
  fileRef: string;
  thumbnailRef?: string;
};

type MediaMap = Record<string, MediaEntry[]>;

function collectImages(dir: string, results: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      collectImages(fullPath, results);
    } else if (stats.isFile()) {
      const ext = extname(entry).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const pairs: { project: string; dir: string }[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--project") {
      const project = args[i + 1];
      const dirFlag = args[i + 2];
      const dir = args[i + 3];
      if (!project || dirFlag !== "--dir" || !dir) {
        throw new Error("Usage: --project <name> --dir <path> (repeat)");
      }
      pairs.push({ project, dir });
      i += 3;
    }
  }
  if (!pairs.length) {
    throw new Error("No project/dir pairs provided.");
  }
  return pairs;
}

async function main() {
  const pairs = parseArgs();
  const outputPath = resolve("prisma/seed/demo_media.json");
  const mediaMap: MediaMap = {};

  for (const { project, dir } of pairs) {
    const absDir = resolve(dir);
    const files = collectImages(absDir).sort();
    if (!files.length) {
      console.warn(`[demo-media] No images found for "${project}" in ${absDir}`);
      mediaMap[project] = [];
      continue;
    }

    console.log(`[demo-media] Uploading ${files.length} images for "${project}"...`);
    const entries: MediaEntry[] = [];
    for (const filePath of files) {
      const buffer = readFileSync(filePath);
      const stored = await storeFile({
        buffer,
        filename: basename(filePath),
      });
      entries.push({
        filename: basename(filePath),
        fileRef: stored.fileRef,
        thumbnailRef: stored.thumbRef,
      });
    }

    mediaMap[project] = entries;
    console.log(`[demo-media] Finished "${project}" (${entries.length})`);
  }

  mkdirSync(join(outputPath, ".."), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(mediaMap, null, 2));
  console.log(`[demo-media] Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error("[demo-media] Failed:", error);
  process.exit(1);
});

