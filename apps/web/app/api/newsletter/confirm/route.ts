import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmSubscription } from "@/features/newsletter/service";
import {
  sameOrigin,
  smallJson,
  newsletterFailure,
} from "@/features/newsletter/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await confirmSubscription(prisma, (await smallJson(request))?.token);
    return NextResponse.json({ success: true });
  } catch (error) {
    return newsletterFailure(error);
  }
}
