import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VISITOR_COOKIE = "qv_visitor";
const interactionTypes = new Set(["DIRECTIONS", "FAVORITE", "RESERVATION_START"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const body = await request.json().catch(() => null) as { type?: string } | null;
  if (!body?.type || !interactionTypes.has(body.type)) return NextResponse.json({ tracked: false }, { status: 400 });
  const place = await prisma.place.findFirst({ where: { id: placeId, status: "APPROVED" }, select: { id: true, ownerId: true } });
  if (!place) return NextResponse.json({ tracked: false }, { status: 404 });
  const session = await auth();
  if (session?.user?.id === place.ownerId) return NextResponse.json({ tracked: false });

  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorKey = existing || randomUUID();
  await prisma.placeInteraction.create({ data: { placeId: place.id, type: body.type, visitorKey } });
  const response = NextResponse.json({ tracked: true });
  if (!existing) response.cookies.set(VISITOR_COOKIE, visitorKey, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
