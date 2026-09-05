import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { STATUS_LABELS } from "./domain";
import { formatReservationPrice } from "./pricing";

type Recipient = {
  id: string;
  emailVerified: Date | null;
  suspendedAt: Date | null;
};
export const notificationUserSelect = {
  id: true,
  emailVerified: true,
  suspendedAt: true,
} as const;

export async function queueNotification(
  tx: Prisma.TransactionClient,
  input: {
    key: string;
    subject: string;
    body: string;
    user: Recipient;
    reservationId?: string;
    expectedReservationStatus?: string;
    expiresAt?: Date;
  },
) {
  if (input.user.suspendedAt) return null;
  const message = await tx.adminMessage.upsert({
    where: { requestKey: input.key },
    update: {},
    create: {
      requestKey: input.key,
      requestFingerprint: createHash("sha256").update(input.key).digest("hex"),
      kind: "RESERVATION",
      audience: "SELECTED",
      subject: input.subject,
      body: input.body,
      sendEmail: true,
      reservationId: input.reservationId,
      expectedReservationStatus: input.expectedReservationStatus,
      expiresAt: input.expiresAt,
      recipients: {
        create: {
          userId: input.user.id,
          emailStatus: input.user.emailVerified ? "PENDING" : "SKIPPED",
        },
      },
    },
    select: { id: true },
  });
  return message.id;
}

export async function queueReservationNotifications(
  tx: Prisma.TransactionClient,
  reservation: {
    id: string;
    reference: string;
    status: string;
    dateTime: Date;
    partySize: number;
    reservationPriceMinor: number;
    reservationCurrency: string;
    customer: Recipient & { name: string };
    place: { name: string; owner: Recipient };
  },
  eventId: string,
  initial: boolean,
) {
  const when = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(reservation.dateTime);
  const status = STATUS_LABELS[reservation.status] || reservation.status;
  const price =
    reservation.reservationPriceMinor === 0
      ? "Réservation gratuite, hors consommations."
      : `Tarif convenu : ${formatReservationPrice(reservation.reservationPriceMinor, reservation.reservationCurrency)} pour la réservation, hors consommations. Règlement directement auprès de l’établissement ; aucun paiement en ligne effectué.`;
  const details = `${reservation.place.name}\nRéférence : ${reservation.reference}\n${when} (Kinshasa)\n${reservation.partySize} personne(s)\n${price}`;
  const customerText =
    reservation.status === "PENDING"
      ? "Votre demande a été transmise. Attendez la confirmation du restaurant."
      : `Le statut de votre réservation a été enregistré : ${status.toLowerCase()}.`;
  const recipients = [
    {
      user: reservation.customer,
      subject: `Réservation ${status.toLowerCase()} — ${reservation.place.name}`,
      body: `${customerText}\n\n${details}\n\nConsultez « Mes réservations » dans Quivibe pour voir le statut actuel.`,
    },
    ...(reservation.place.owner.id === reservation.customer.id
      ? []
      : [
          {
            user: reservation.place.owner,
            subject: `${initial ? "Nouvelle réservation" : "Réservation mise à jour"} — ${reservation.reference}`,
            body: `${reservation.customer.name} : ${status.toLowerCase()}.\n\n${details}\n\nConsultez les réservations de votre espace professionnel pour traiter la demande.`,
          },
        ]),
  ];
  const ids: string[] = [];
  for (const recipient of recipients) {
    const id = await queueNotification(tx, {
      ...recipient,
      key: `reservation:${eventId}:${recipient.user.id}`,
      reservationId: reservation.id,
    });
    if (id) ids.push(id);
  }
  return ids;
}
