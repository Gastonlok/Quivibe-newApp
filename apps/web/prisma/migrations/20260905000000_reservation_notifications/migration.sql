ALTER TABLE "reservations" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

CREATE TABLE "reservation_waitlist" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "partySize" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'WAITING',
  "notifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "placeId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,

  CONSTRAINT "reservation_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reservation_waitlist_placeId_customerId_date_key"
  ON "reservation_waitlist"("placeId", "customerId", "date");
CREATE INDEX "reservation_waitlist_placeId_date_status_idx"
  ON "reservation_waitlist"("placeId", "date", "status");

ALTER TABLE "reservation_waitlist"
  ADD CONSTRAINT "reservation_waitlist_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_waitlist"
  ADD CONSTRAINT "reservation_waitlist_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
