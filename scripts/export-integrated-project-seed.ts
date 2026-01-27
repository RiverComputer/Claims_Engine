import { mkdirSync, writeFileSync, existsSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/db/client";

const PROJECTS = [
  { title: "Integrated Project Canvas", slug: "integrated-project-canvas" },
  { title: "Essential Schema", slug: "essential-schema" },
];
const OUTPUT_SEED = "prisma/seed/demo_seed.sql";
const OUTPUT_PUBLIC_BASE = "public/demo";
const UPLOADS_DIR = "uploads";

function esc(value: any) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

function formatDate(value: any) {
  if (!value) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
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

function normalizeFileRef(ref?: string | null, outputDir?: string, slug?: string) {
  if (!ref) return null;
  if (ref.startsWith("data:")) return ref;
  if (ref.startsWith("/demo/")) return ref;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
  if (ref.startsWith("/api/files/")) {
    const id = ref.split("/api/files/")[1]?.split("?")[0];
    if (!id) return ref;
    const uploadPath = findUploadFile(id);
    if (!uploadPath) return ref;
    if (!outputDir || !slug) return ref;
    ensureDir(outputDir);
    const filename = uploadPath.split("/").pop() as string;
    const destPath = join(outputDir, filename);
    if (!existsSync(destPath)) {
      copyFileSync(uploadPath, destPath);
    }
    return `/demo/${slug}/${filename}`;
  }
  return ref;
}

async function main() {
  const lines: string[] = [];
  lines.push("-- Project seed data");
  lines.push("BEGIN;");

  for (const projectConfig of PROJECTS) {
    const project = await prisma.project.findFirst({
      where: { title: projectConfig.title },
    });

    if (!project) {
      console.warn(`Project not found: ${projectConfig.title}. Skipping.`);
      continue;
    }

    const nodes = await prisma.node.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    });
    const edges = await prisma.edge.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    });

    const outputDir = join(OUTPUT_PUBLIC_BASE, projectConfig.slug);

    lines.push(`-- ${projectConfig.title}`);
    lines.push(
      `DELETE FROM "Edge" WHERE "projectId" IN (SELECT id FROM "Project" WHERE title = ${esc(
        projectConfig.title
      )});`
    );
    lines.push(
      `DELETE FROM "Node" WHERE "projectId" IN (SELECT id FROM "Project" WHERE title = ${esc(
        projectConfig.title
      )});`
    );
    lines.push(
      `DELETE FROM "Project" WHERE title = ${esc(projectConfig.title)};`
    );

    lines.push(
      `INSERT INTO "Project" ("id","title","description","ownerUserId","createdAt","updatedAt") VALUES (${[
        esc(project.id),
        esc(project.title),
        esc(project.description),
        esc(project.ownerUserId),
        esc(formatDate(project.createdAt)),
        esc(formatDate(project.updatedAt)),
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
        const fileRef = normalizeFileRef(dataObj.fileRef, outputDir, projectConfig.slug);
        const thumbRef = normalizeFileRef(dataObj.thumbnailRef, outputDir, projectConfig.slug);
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
          esc(formatDate(node.createdAt)),
          esc(formatDate(node.updatedAt)),
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
          esc(formatDate(edge.createdAt)),
        ].join(",")});`
      );
    }
  }

  lines.push("COMMIT;");

  ensureDir(join(OUTPUT_SEED, ".."));
  writeFileSync(OUTPUT_SEED, lines.join("\n"));

  console.log(`Wrote seed SQL to ${OUTPUT_SEED}`);
  console.log(`Copied uploads to ${OUTPUT_PUBLIC_BASE} when needed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

