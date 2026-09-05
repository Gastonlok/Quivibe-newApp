import { NextResponse } from "next/server";
import { deliverAdminEmails } from "@/features/admin/messages";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  return NextResponse.json(await deliverAdminEmails());
}
