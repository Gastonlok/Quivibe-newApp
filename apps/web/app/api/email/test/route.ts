// apps/web/app/api/email/test/route.ts
import { NextResponse } from "next/server";
import { sendWelcomeEmail, sendOwnerRequestStatusEmail } from "@/lib/email";

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Tester l'email de bienvenue
    await sendWelcomeEmail(
      "test@example.com",
      "Utilisateur Test",
      appUrl
    );

    // Tester l'email de statut propriétaire
    await sendOwnerRequestStatusEmail(
      "test@example.com",
      "Utilisateur Test",
      "Mon Restaurant",
      "APPROVED",
      "Félicitations ! Votre demande a été acceptée.",
      appUrl
    );

    return NextResponse.json({
      message: "Emails de test envoyés avec succès !",
      note: "Vérifiez votre boîte mail (ou la console pour les logs)"
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails" },
      { status: 500 }
    );
  }
}
