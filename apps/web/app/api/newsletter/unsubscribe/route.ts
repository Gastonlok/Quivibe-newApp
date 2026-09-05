import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unsubscribe } from "@/features/newsletter/service";
import { smallJson, newsletterFailure } from "@/features/newsletter/http";
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token =
      url.searchParams.get("token") || (await smallJson(request))?.token;
    await unsubscribe(prisma, token);
    return new Response(null, { status: 200 });
  } catch (error) {
    return newsletterFailure(error);
  }
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/newsletter/unsubscribe";
  return NextResponse.redirect(url);
}
