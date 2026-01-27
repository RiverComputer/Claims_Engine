import { readFileSync } from "fs";
import { Client } from "pg";
import { prisma } from "../../lib/db/client";

const PROJECT_TITLES = ["Integrated Project Canvas", "Essential Schema"];

const seedPath = "prisma/seed/demo_seed.sql";

async function main() {
  const force = process.env.SEED_FORCE === "1";
  if (!force) {
    const existing = await prisma.project.findFirst({
      where: { title: { in: PROJECT_TITLES } },
    });

    if (existing) {
      console.log("Seed skipped: project already exists.");
      return;
    }
  }

  const sql = readFileSync(seedPath, "utf-8");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Cannot run seed.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query(sql);
  await client.end();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

