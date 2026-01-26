import { readFileSync } from "fs";
import { prisma } from "../../lib/db/client";

const PROJECT_TITLE = "Integrated Project Canvas";

const seedPath = "prisma/seed/demo_seed.sql";

function splitStatements(sql: string) {
  return sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt && !stmt.startsWith("--"));
}

async function main() {
  const existing = await prisma.project.findFirst({
    where: { title: PROJECT_TITLE },
  });

  if (existing) {
    console.log(`Seed skipped: "${PROJECT_TITLE}" already exists.`);
    return;
  }

  const sql = readFileSync(seedPath, "utf-8");
  const statements = splitStatements(sql);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

