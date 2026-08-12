// apps/web/lib/email.ts
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";
import { OwnerRequestStatusEmail } from "@/emails/owner-request-status";
import { FavoriteReminderEmail } from "@/emails/favorite-reminder";

// ✅ Utiliser un getter lazy pour Resend
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined");
  }
  return new Resend(apiKey);
}

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// ✅ Dans chaque fonction, appeler getResend()
export async function sendWelcomeEmail(
  email: string,
  name: string,
  appUrl: string
) {
  try {
    console.log("📧 Préparation de l'email de bienvenue pour:", email);

    // ✅ Récupérer Resend seulement si nécessaire
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Bienvenue sur Quivibe ! 🎉",
      react: WelcomeEmail({
        userEmail: email,
        userName: name,
        appUrl,
      }),
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error };
    }

    console.log("✅ Email envoyé avec succès! ID:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
    return { success: false, error };
  }
}
