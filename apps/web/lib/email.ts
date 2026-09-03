// apps/web/lib/email.ts
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const resendEndpoint = "https://api.resend.com/emails";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailDisabledResult() {
  return {
    success: false as const,
    skipped: true as const,
    error: "RESEND_API_KEY n'est pas configurée.",
  };
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return emailDisabledResult();

  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      return {
        success: false as const,
        error: data || `Resend a répondu avec le statut ${response.status}`,
      };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Erreur d'envoi d'email:", error);
    return { success: false as const, error };
  }
}

function emailLayout(title: string, body: string, action?: { label: string; url: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const logoUrl = `${appUrl.replace(/\/$/, "")}/brand/quivibe-logo.png`;
  const button = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#f99216;color:#171717;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:800">${escapeHtml(action.label)}</a></p>`
    : "";

  return `<!doctype html><html lang="fr"><body style="margin:0;background:#fff4e8;font-family:Arial,sans-serif;color:#171717"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="overflow:hidden;background:#ffffff;border:1px solid #f9d2a5;border-radius:24px"><div style="padding:24px 32px;background:#f99216;text-align:center"><img src="${escapeHtml(logoUrl)}" alt="Quivibe" width="220" style="display:block;width:220px;max-width:100%;height:auto;margin:0 auto" /></div><div style="padding:32px"><p style="margin:0 0 14px;color:#b95000;font-size:12px;font-weight:800;letter-spacing:1.6px">QUIVIBE</p><h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#171717">${escapeHtml(title)}</h1>${body}${button}<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #fde3c4;color:#766b61;font-size:13px">Notification automatique Quivibe. Ne cherchez plus, vibe où tu veux.</p></div></div></div></body></html>`;
}

export function sendWelcomeEmail(email: string, name: string, appUrl: string) {
  const safeName = escapeHtml(name);
  return sendEmail({
    to: email,
    subject: "Bienvenue sur Quivibe",
    html: emailLayout(
      "Bienvenue sur Quivibe",
      `<p style="line-height:1.7">Bonjour ${safeName}, votre compte est prêt. Découvrez les établissements de Kinshasa et gérez vos réservations depuis votre espace personnel.</p>`,
      { label: "Découvrir Quivibe", url: appUrl },
    ),
  });
}

export function sendOwnerRequestStatusEmail(
  email: string,
  name: string,
  placeName: string,
  status: "APPROVED" | "REJECTED",
  adminNote: string | undefined,
  appUrl: string,
) {
  const approved = status === "APPROVED";
  const note = adminNote
    ? `<p style="line-height:1.7"><strong>Note de l’équipe :</strong> ${escapeHtml(adminNote)}</p>`
    : "";

  return sendEmail({
    to: email,
    subject: approved
      ? "Votre accès propriétaire Quivibe est activé"
      : "Mise à jour de votre demande propriétaire Quivibe",
    html: emailLayout(
      approved ? "Demande approuvée" : "Demande non approuvée",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(name)}, la demande concernant <strong>${escapeHtml(placeName)}</strong> a été ${approved ? "approuvée" : "refusée"}.</p>${note}`,
      approved ? { label: "Ouvrir l’espace propriétaire", url: `${appUrl}/owner/dashboard` } : undefined,
    ),
  });
}

export function sendFavoriteReminderEmail(
  email: string,
  name: string,
  favoritePlaces: { name: string; slug: string; neighborhood: string }[],
  appUrl: string,
) {
  if (favoritePlaces.length === 0) {
    return Promise.resolve({ success: false as const, error: "Aucun favori à rappeler" });
  }

  const items = favoritePlaces
    .map(
      (place) =>
        `<li style="margin:10px 0"><a href="${escapeHtml(`${appUrl}/places/${place.slug}`)}" style="color:#b95000;font-weight:700">${escapeHtml(place.name)}</a> — ${escapeHtml(place.neighborhood)}</li>`,
    )
    .join("");

  return sendEmail({
    to: email,
    subject: `${favoritePlaces.length} lieux vous attendent sur Quivibe`,
    html: emailLayout(
      "Vos établissements favoris",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(name)}, voici les lieux que vous avez enregistrés :</p><ul style="padding-left:20px">${items}</ul>`,
      { label: "Voir mes favoris", url: `${appUrl}/favorites` },
    ),
  });
}

export function sendTestEmail(email: string) {
  return sendEmail({
    to: email,
    subject: "Test Quivibe Email",
    html: emailLayout(
      "Test réussi",
      '<p style="line-height:1.7">Le système de notifications Quivibe est correctement configuré.</p>',
    ),
  });
}

export function sendEmailVerificationEmail(email: string, name: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Confirmez votre adresse email Quivibe",
    html: emailLayout(
      "Confirmez votre adresse email",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(name)}, confirmez votre adresse email pour securiser votre compte Quivibe.</p>`,
      { label: "Confirmer mon email", url },
    ),
  });
}

export function sendPasswordResetEmail(email: string, name: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Reinitialisez votre mot de passe Quivibe",
    html: emailLayout(
      "Reinitialisation du mot de passe",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(name)}, utilisez ce lien pour choisir un nouveau mot de passe. Il expire dans une heure.</p>`,
      { label: "Choisir un nouveau mot de passe", url },
    ),
  });
}

export function sendReservationEmail(input: {
  email: string;
  name: string;
  placeName: string;
  reference: string;
  dateTime: Date;
  status: string;
}) {
  const cancelled = input.status === "CANCELLED";
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(input.dateTime);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return sendEmail({
    to: input.email,
    subject: cancelled ? "Votre reservation Quivibe est annulee" : "Votre reservation Quivibe est confirmee",
    html: emailLayout(
      cancelled ? "Reservation annulee" : "Reservation enregistree",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(input.name)}, votre reservation chez <strong>${escapeHtml(input.placeName)}</strong> ${cancelled ? "a ete annulee" : "est enregistree"}.</p><p style="line-height:1.7"><strong>Date :</strong> ${escapeHtml(date)}<br/><strong>Reference :</strong> ${escapeHtml(input.reference)}</p>`,
      { label: "Voir mes reservations", url: `${appUrl}/reservations` },
    ),
  });
}


export function sendReservationReminderEmail(input: {
  email: string;
  name: string;
  placeName: string;
  reference: string;
  dateTime: Date;
}) {
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(input.dateTime);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return sendEmail({
    to: input.email,
    subject: `Rappel : votre reservation chez ${input.placeName} est demain`,
    html: emailLayout(
      "Votre table vous attend demain",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(input.name)}, rappel de votre reservation chez <strong>${escapeHtml(input.placeName)}</strong>.</p><p style="line-height:1.7"><strong>Date :</strong> ${escapeHtml(date)}<br/><strong>Reference :</strong> ${escapeHtml(input.reference)}</p>`,
      { label: "Voir ma reservation", url: `${appUrl}/reservations` },
    ),
  });
}

export function sendWaitlistAvailabilityEmail(email: string, name: string, placeName: string, placeSlug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return sendEmail({
    to: email,
    subject: `Une table peut etre disponible chez ${placeName}`,
    html: emailLayout(
      "Une disponibilite vient de se liberer",
      `<p style="line-height:1.7">Bonjour ${escapeHtml(name)}, une table peut etre disponible chez <strong>${escapeHtml(placeName)}</strong>. Reprenez votre reservation rapidement pour consulter les creneaux proposes.</p>`,
      { label: "Voir les disponibilites", url: `${appUrl}/places/${placeSlug}` },
    ),
  });
}
