import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/access";
import { prisma } from "@/lib/prisma";
import { deliverNewsletter } from "@/features/newsletter/delivery";
import { newsletterFailure, sameOrigin } from "@/features/newsletter/http";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!(await getAdminActor("MESSAGES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    sameOrigin(request);
    return NextResponse.json(await deliverNewsletter(prisma));
  } catch (error) {
    return newsletterFailure(error);
  }
}
