import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isVisitorKey,
  publicPlaceForTracking,
  recordVisit,
  visitChannel,
  VISITOR_COOKIE,
} from "@/features/owner/tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  const session = await auth();
  if (!(await publicPlaceForTracking(placeId, session?.user)))
    return NextResponse.json({ tracked: false });
  const previous = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorKey = isVisitorKey(previous) ? previous : randomUUID();
  const body = await request.json().catch(() => null);
  const result = await recordVisit(
    placeId,
    visitorKey,
    visitChannel(body?.channel),
  );
  const response = NextResponse.json(result);
  if (visitorKey !== previous)
    response.cookies.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  return response;
}
