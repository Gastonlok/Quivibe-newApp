import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "qv_visitor";
const VISIT_COOLDOWN_MS = 30 * 60 * 1_000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  const place = await prisma.place.findFirst({
    where: { id: placeId, status: "APPROVED" },
    select: { id: true, ownerId: true },
  });
  if (!place) return NextResponse.json({ tracked: false }, { status: 404 });

  const session = await auth();
  if (session?.user?.id === place.ownerId) {
    return NextResponse.json({ tracked: false });
  }

  const previousVisitorKey = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorKey = previousVisitorKey || randomUUID();
  const recentVisit = await prisma.placeVisit.findFirst({
    where: {
      placeId: place.id,
      visitorKey,
      visitedAt: { gte: new Date(Date.now() - VISIT_COOLDOWN_MS) },
    },
    select: { id: true },
  });

  if (!recentVisit) {
    await prisma.placeVisit.create({ data: { placeId: place.id, visitorKey } });
  }

  const response = NextResponse.json({ tracked: !recentVisit });
  if (!previousVisitorKey) {
    response.cookies.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
