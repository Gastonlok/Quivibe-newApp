import { NextResponse } from "next/server";
import { getAdminActor } from "@/features/admin/access";
import { auth } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";
export async function POST() {
  if (!(await getAdminActor("MESSAGES")))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const result = await sendTestEmail(session.user.email);
  return result.success
    ? NextResponse.json({
        message: "E-mail de test accepté par le prestataire.",
      })
    : NextResponse.json(
        { error: "E-mail non envoyé. Vérifiez la configuration Resend." },
        { status: 503 },
      );
}
