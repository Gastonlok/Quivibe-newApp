import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isVisitorKey,
  publicPlaceForTracking,
  recordInteraction,
  VISITOR_COOKIE,
} from "@/features/owner/tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  const body = await request.json().catch(() => null);
  if (
    !body?.type ||
    !["DIRECTIONS", "FAVORITE", "RESERVATION_START"].includes(body.type)
  )
    return NextResponse.json({ tracked: false }, { status: 400 });
  const session = await auth();
  const visitorKey = request.cookies.get(VISITOR_COOKIE)?.value;
  if (
    !isVisitorKey(visitorKey) ||
    !(await publicPlaceForTracking(placeId, session?.user))
  )
    return NextResponse.json({ tracked: false });
  return NextResponse.json({
    tracked: await recordInteraction(placeId, visitorKey, body.type),
  });
}
