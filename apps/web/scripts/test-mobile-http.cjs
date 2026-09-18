// Real HTTP + PostgreSQL integration test; local server and temporary schema only.
const { createRequire } = require("node:module");
const { randomUUID, randomBytes } = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(process.cwd(), true);
async function main() {
  const local = new URL(process.env.DIRECT_URL || process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(local.hostname)) throw new Error("Local PostgreSQL required");
  const schema = "pilot_test_" + randomUUID().replaceAll("-", "");
  const control = new PrismaClient({ datasources: { db: { url: local.toString() } } });
  let db, server, created = false;
  try {
    await control.$executeRawUnsafe('CREATE SCHEMA "' + schema + '"');
    created = true;
    local.searchParams.set("schema", schema);
    const base = "http://127.0.0.1:3018";
    const env = { ...process.env, DATABASE_URL: local.toString(), DIRECT_URL: local.toString(), AUTH_SECRET: randomBytes(32).toString("hex"), AUTH_URL: base, NEXT_PUBLIC_APP_URL: base, RESEND_API_KEY: "", NODE_ENV: "development" };
    const migration = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], { env, stdio: "pipe", windowsHide: true });
    if (migration.status !== 0) throw new Error("Temporary schema migration failed");
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    const password = randomBytes(18).toString("hex"), passwordHash = await bcrypt.hash(password, 12);
    const makeUser = (role) => db.user.create({ data: { name: "Mobile HTTP fixture", email: randomUUID() + "@example.invalid", role, emailVerified: new Date(), passwordHash } });
    const owner = await makeUser("OWNER"), customer = await makeUser("USER"), stranger = await makeUser("USER");
    const place = await db.place.create({ data: { name: "Mobile HTTP fixture", slug: "mobile-test-" + randomUUID(), description: "Isolated integration fixture", address: "Test", neighborhood: "Test", latitude: 0, longitude: 0, priceRange: 1, status: "APPROVED", ownerId: owner.id } });
    server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "-p", "3018", "-H", "127.0.0.1"], { env, stdio: "ignore", windowsHide: true });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { const r = await fetch(base + "/api/mobile/session", { signal: AbortSignal.timeout(3000) }); if (r.status === 401) { ready = true; break; } } catch {}
      if (server.exitCode !== null) throw new Error("Test HTTP server stopped");
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("Test HTTP server did not start");
    async function api(path, { method = "GET", body, token, expected = 200 } = {}) {
      const response = await fetch(base + "/api/mobile/" + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, expected, method + " " + path);
      return response.json();
    }
    await api("reservations", { expected: 401 });
    const catalogue = await api("venues");
    assert.equal(catalogue.total, 1);
    const detail = await api("venues/" + place.slug);
    assert.equal(detail.id, place.id); assert.equal(detail.owner, undefined);
    const session = await api("session", { method: "POST", body: { email: customer.email, password } });
    const token = session.token;
    assert.match(token, /^qvm_[a-f0-9]{64}$/);
    const storedSession = await db.session.findFirst({ where: { userId: customer.id } });
    assert.ok(storedSession && storedSession.sessionToken !== token);
    assert.equal((await api("session", { token })).user.id, customer.id);
    await api("favorites/" + place.id, { method: "PUT", token });
    await api("favorites/" + place.id, { method: "PUT", token });
    assert.equal((await api("favorites", { token })).total, 1);
    const date = new Date(Date.now() + 7 * 86400000 + 3600000).toISOString().slice(0, 10);
    const available = await api("venues/" + place.id + "/availability?date=" + date + "&partySize=2");
    assert.ok(available.slots.length > 0);
    const body = { requestKey: randomUUID(), placeId: place.id, date, time: available.slots[0], partySize: 2, expectedPriceMinor: available.quote.amountMinor, expectedCurrency: available.quote.currency };
    const booking = await api("reservations", { method: "POST", body, token });
    const retry = await api("reservations", { method: "POST", body, token });
    assert.equal(retry.reference, booking.reference);
    assert.equal(await db.reservation.count({ where: { customerId: customer.id } }), 1);
    const saved = await api("reservations/" + booking.reference, { token });
    assert.equal(saved.status, "CONFIRMED");
    assert.equal((await db.reservation.findUnique({ where: { id: saved.id } })).customerId, customer.id);
    const other = await api("session", { method: "POST", body: { email: stranger.email, password } });
    await api("reservations/" + booking.reference, { token: other.token, expected: 404 });
    await api("reviews", { method: "POST", token, expected: 201, body: { placeId: place.id, rating: 5, comment: "Avis de recette mobile en base locale." } });
    assert.equal((await api("reviews/mine", { token })).items[0].status, "PENDING");
    assert.equal((await api("reviews/" + place.id)).total, 0);
    await api("reservations/" + saved.id, { method: "DELETE", token });
    assert.equal((await api("reservations/" + booking.reference, { token })).status, "CANCELLED");
    await api("session", { method: "DELETE", token });
    await api("session", { token, expected: 401 });
    console.log("PASS: real HTTP login, hashed session, public catalogue, idempotent favorites, PostgreSQL booking, retry without duplicate, private ownership, moderated review, cancellation, revoked logout.");
  } finally {
    if (server?.pid) {
      if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      else server.kill("SIGTERM");
    }
    await db?.$disconnect();
    if (created && /^pilot_test_[a-f0-9]{32}$/.test(schema)) await control.$executeRawUnsafe('DROP SCHEMA "' + schema + '" CASCADE');
    await control.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
