-- AlterTable
ALTER TABLE "admin_messages" ADD COLUMN     "expectedReservationStatus" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "reservationId" TEXT;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "commercialStatus" TEXT NOT NULL DEFAULT 'PILOT',
ADD COLUMN     "pilotStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "attributedVisitId" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "ownerIdAtBooking" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'NOT_TRACKED',
ADD COLUMN     "reminderQueuedAt" TIMESTAMP(3),
ADD COLUMN     "requestFingerprint" TEXT,
ADD COLUMN     "requestKey" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'QUIVIBE',
ADD COLUMN     "totalAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "place_visits" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'UNKNOWN';

-- CreateTable
CREATE TABLE "reservation_status_events" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservation_status_events_reservationId_createdAt_idx" ON "reservation_status_events"("reservationId", "createdAt");

-- CreateIndex
CREATE INDEX "reservation_status_events_createdAt_actorRole_idx" ON "reservation_status_events"("createdAt", "actorRole");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_requestKey_key" ON "reservations"("requestKey");

-- CreateIndex
CREATE INDEX "reservations_placeId_createdAt_idx" ON "reservations"("placeId", "createdAt");

-- CreateIndex
CREATE INDEX "reservations_attributedVisitId_idx" ON "reservations"("attributedVisitId");

-- AddForeignKey
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_attributedVisitId_fkey" FOREIGN KEY ("attributedVisitId") REFERENCES "place_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_status_events" ADD CONSTRAINT "reservation_status_events_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_status_events" ADD CONSTRAINT "reservation_status_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unknown historical owners and amounts stay NULL; do not fabricate past events.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_amount_currency_check"
  CHECK (("totalAmount" IS NULL AND "currency" IS NULL) OR
    ("totalAmount" IS NOT NULL AND "totalAmount" >= 0 AND "currency" IS NOT NULL AND "currency" ~ '^[A-Z]{3}$'));
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_commission_check"
  CHECK ("commissionRate" >= 0 AND "commissionRate" <= 1 AND "commissionAmount" >= 0);
