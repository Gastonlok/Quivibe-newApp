const { createRequire } = require("node:module");
const { randomUUID } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(
  process.cwd(),
  true,
);

async function main() {
  const base = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
    throw new Error("This test runner only accepts a local PostgreSQL server.");
  const schema = `pilot_test_${randomUUID().replaceAll("-", "")}`;
  if (!/^pilot_test_[a-f0-9]{32}$/.test(schema))
    throw new Error("Invalid isolated schema");
  const db = new PrismaClient({
    datasources: { db: { url: base.toString() } },
  });
  let created = false;
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    created = true;
    base.searchParams.set("schema", schema);
    const env = {
      ...process.env,
      DATABASE_URL: base.toString(),
      DIRECT_URL: base.toString(),
      RESERVATION_TEST_DATABASE_URL: base.toString(),
      RESEND_API_KEY: "",
    };
    const migrate = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { env, stdio: "inherit" },
    );
    if (migrate.status !== 0) throw new Error("Test database migration failed");
    const tests = spawnSync(
      process.execPath,
      [
        "node_modules/vitest/vitest.mjs",
        "run",
        "features/reservations/service.integration.test.ts",
        "features/places/search.integration.test.ts",
        "features/newsletter/service.integration.test.ts",
      ],
      { env, stdio: "inherit" },
    );
    process.exitCode = tests.status ?? 1;
  } finally {
    // Only the schema generated and created by this invocation can be removed.
    if (created) await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error("Isolated PostgreSQL test failed.");
  process.exitCode = 1;
});
