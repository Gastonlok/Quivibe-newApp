import { createHash, randomBytes } from "node:crypto";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
export const tokenHash = (token: string) =>
  "mobile:" + createHash("sha256").update(token).digest("hex");
export async function issueSession(userId: string) {
  const token = "qvm_" + randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86400000);
  await prisma.session.create({
    data: { userId, sessionToken: tokenHash(token), expires },
  });
  return { token, expires: expires.toISOString() };
}
export async function readSession(request: Request): Promise<Session | null> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (qvm_[a-f0-9]{64})$/)?.[1];
  if (!token || !/^qvm_[a-f0-9]{64}$/.test(token)) return null;
  const record = await prisma.session.findUnique({
    where: { sessionToken: tokenHash(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          suspendedAt: true,
          moderationPermissions: true,
        },
      },
    },
  });
  if (!record || record.expires <= new Date() || record.user.suspendedAt)
    return null;
  const { suspendedAt: _suspended, ...user } = record.user;
  return { user, expires: record.expires.toISOString() };
}
export async function revokeSession(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (qvm_[a-f0-9]{64})$/)?.[1];
  if (token)
    await prisma.session.deleteMany({
      where: { sessionToken: tokenHash(token) },
    });
}
// Best-effort per-instance throttling; put a shared WAF/rate limit in front of
// this endpoint for multi-instance production deployments.
const attempts = new Map<string, { count: number; until: number }>();
export function allowLogin(key: string, now = Date.now()) {
  for (const [id, value] of attempts)
    if (value.until <= now) attempts.delete(id);
  const id = createHash("sha256").update(key).digest("hex");
  const value = attempts.get(id) || { count: 0, until: now + 900000 };
  if (!attempts.has(id) && attempts.size >= 5000) return false;
  value.count++;
  attempts.set(id, value);
  return value.count <= 10;
}
