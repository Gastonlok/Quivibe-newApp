// apps/web/lib/email.ts
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";
import { OwnerRequestStatusEmail } from "@/emails/owner-request-status";
import { FavoriteReminderEmail } from "@/emails/favorite-reminder";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendWelcomeEmail(
  email: string,
  name: string,
  appUrl: string
) {
  try {
    console.log("📧 Préparation de l'email de bienvenue pour:", email);

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

export async function sendOwnerRequestStatusEmail(
  email: string,
  name: string,
  placeName: string,
  status: "APPROVED" | "REJECTED",
  adminNote: string | undefined,
  appUrl: string
) {
  try {
    console.log(`📧 Envoi email statut propriétaire à ${email} (${status})`);

    const subject = status === "APPROVED"
      ? "✅ Votre demande propriétaire a été approuvée !"
      : "❌ Votre demande propriétaire a été refusée";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      react: OwnerRequestStatusEmail({
        userEmail: email,
        userName: name,
        placeName,
        status,
        adminNote,
        appUrl,
      }),
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error };
    }

    console.log(`✅ Email statut propriétaire envoyé! ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
    return { success: false, error };
  }
}

export async function sendFavoriteReminderEmail(
  email: string,
  name: string,
  favoritePlaces: { name: string; slug: string; neighborhood: string }[],
  appUrl: string
) {
  try {
    if (favoritePlaces.length === 0) {
      console.log("ℹ️ Aucun favori à rappeler pour", email);
      return { success: false, error: "Aucun favori à rappeler" };
    }

    console.log(`📧 Envoi rappel favoris à ${email} (${favoritePlaces.length} lieux)`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `📌 ${favoritePlaces.length} lieux vous attendent sur Quivibe !`,
      react: FavoriteReminderEmail({
        userEmail: email,
        userName: name,
        favoritePlaces,
        appUrl,
      }),
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error };
    }

    console.log(`✅ Rappel favoris envoyé! ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
    return { success: false, error };
  }
}

// Fonction de test
export async function sendTestEmail(email: string) {
  try {
    console.log(`📧 Envoi d'un email de test à ${email}...`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Test Quivibe Email",
      html: `<p>Bonjour ! Ceci est un email de test de <strong>Quivibe</strong>.</p>
             <p>Votre système de notifications par email fonctionne correctement !</p>
             <p>📧 ${new Date().toLocaleString()}</p>
             <p>🔑 Clé API: ${process.env.RESEND_API_KEY ? "✅ Définie" : "❌ Non définie"}</p>`,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      return { success: false, error };
    }

    console.log("✅ Email de test envoyé! ID:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur:", error);
    return { success: false, error };
  }
}
