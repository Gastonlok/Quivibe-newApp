import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/access";
import { deliverAdminEmails } from "@/features/admin/messages";
export const maxDuration = 60;
export async function POST() {
  if (!(await getAdminActor("MESSAGES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  return NextResponse.json(await deliverAdminEmails());
}
