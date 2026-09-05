import { createHmac, timingSafeEqual } from "node:crypto";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Newsletter token signing is unavailable");
  return createHmac("sha256", secret)
    .update(`newsletter:${value}`)
    .digest("base64url");
}
export function newsletterToken(
  id: string,
  version: string,
  purpose: "confirm" | "unsubscribe",
) {
  const payload = `${purpose}.${id}.${version}`;
  return `${payload}.${sign(payload)}`;
}
export function readNewsletterToken(
  token: unknown,
  purpose: "confirm" | "unsubscribe",
) {
  if (typeof token !== "string" || token.length > 300) return null;
  const parts = token.split(".");
  if (
    parts.length !== 4 ||
    parts[0] !== purpose ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(parts[1]) ||
    !/^[a-f0-9-]{36}$/.test(parts[2])
  )
    return null;
  const expected = Buffer.from(sign(parts.slice(0, 3).join("."))),
    actual = Buffer.from(parts[3]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  return { id: parts[1], version: parts[2] };
}
export function newsletterRateKey(ip: string, now: Date) {
  return `signup:${sign(ip.slice(0, 100))}:${Math.floor(now.getTime() / 3600000)}`;
}
