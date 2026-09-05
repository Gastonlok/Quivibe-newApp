import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor } from "@/features/admin/access";
export async function GET(request: Request) {
  if (!(await getAdminActor("USERS")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").slice(0, 120);
  const page = Math.max(1, Math.min(100000, Number(params.get("page")) || 1));
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (Math.floor(page) - 1) * 50,
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspendedAt: true,
        moderationPermissions: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ users, total });
}
