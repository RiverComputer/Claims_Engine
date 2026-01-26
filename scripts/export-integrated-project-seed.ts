import { mkdirSync, writeFileSync, existsSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/db/client";

const PROJECT_TITLE = "Integrated Project Canvas";
const OUTPUT_SEED = "prisma/seed/demo_seed.sql";
const OUTPUT_PUBLIC_DIR = "public/demo/integrated-project-canvas";
const UPLOADS_DIR = "uploads";

function esc(value: any) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function findUploadFile(id: string) {
  if (!existsSync(UPLOADS_DIR)) return null;
  const files = readdirSync(UPLOADS_DIR);
  const match = files.find((name) => name === id || name.startsWith(`${id}.`));
  if (!match) return null;
  return join(UPLOADS_DIR, match);
}

function normalizeFileRef(ref?: string | null) {
  if (!ref) return null;
  if (ref.startsWith("data:")) return ref;
  if (ref.startsWith("/demo/")) return ref;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  if (ref.startsWith("/api/files/")) {
    const id = ref.split("/api/files/")[1]?.split("?")[0];
    if (!id) return ref;
    const uploadPath = findUploadFile(id);
    if (!uploadPath) return ref;
    ensureDir(OUTPUT_PUBLIC_DIR);
    const filename = uploadPath.split("/").pop() as string;
    const destPath = join(OUTPUT_PUBLIC_DIR, filename);
    if (!existsSync(destPath)) {
      copyFileSync(uploadPath, destPath);
    }
    return `/demo/integrated-project-canvas/${filename}`;
  }
  return ref;
}

async function main() {
  const project = await prisma.project.findFirst({
    where: { title: PROJECT_TITLE },
  });

  if (!project) {
    throw new Error(`Project not found: ${PROJECT_TITLE}`);
  }

  const nodes = await prisma.node.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  const edges = await prisma.edge.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });

  const lines: string[] = [];
  lines.push("-- Integrated Project Canvas seed data");
  lines.push("BEGIN;");

  lines.push(
    `INSERT INTO "Project" ("id","title","description","ownerUserId","createdAt","updatedAt") VALUES (${[
      esc(project.id),
      esc(project.title),
      esc(project.description),
      esc(project.ownerUserId),
      esc(project.createdAt),
      esc(project.updatedAt),
    ].join(",")});`
  );

  for (const node of nodes) {
    let dataObj: any = {};
    try {
      dataObj = JSON.parse(node.data);
    } catch {
      dataObj = node.data;
    }

    if (node.type === "evidence" && dataObj && typeof dataObj === "object") {
      const fileRef = normalizeFileRef(dataObj.fileRef);
      const thumbRef = normalizeFileRef(dataObj.thumbnailRef);
      dataObj.fileRef = fileRef || dataObj.fileRef;
      if (dataObj.thumbnailRef && String(dataObj.thumbnailRef).startsWith("data:")) {
        // keep cropped thumbnail data URL
      } else {
        dataObj.thumbnailRef = thumbRef || dataObj.thumbnailRef || fileRef;
      }
    }

    const dataJson = typeof dataObj === "string" ? dataObj : JSON.stringify(dataObj);

    lines.push(
      `INSERT INTO "Node" ("id","projectId","type","status","positionX","positionY","data","cid","attestationUID","createdAt","updatedAt") VALUES (${[
        esc(node.id),
        esc(node.projectId),
        esc(node.type),
        esc(node.status),
        esc(node.positionX),
        esc(node.positionY),
        esc(dataJson),
        esc(node.cid),
        esc(node.attestationUID),
        esc(node.createdAt),
        esc(node.updatedAt),
      ].join(",")});`
    );
  }

  for (const edge of edges) {
    lines.push(
      `INSERT INTO "Edge" ("id","projectId","fromNodeId","toNodeId","type","locked","createdAt") VALUES (${[
        esc(edge.id),
        esc(edge.projectId),
        esc(edge.fromNodeId),
        esc(edge.toNodeId),
        esc(edge.type),
        esc(edge.locked),
        esc(edge.createdAt),
      ].join(",")});`
    );
  }

  lines.push("COMMIT;");

  ensureDir(join(OUTPUT_SEED, ".."));
  writeFileSync(OUTPUT_SEED, lines.join("\n"));

  console.log(`Wrote seed SQL to ${OUTPUT_SEED}`);
  console.log(`Copied uploads to ${OUTPUT_PUBLIC_DIR} when needed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

