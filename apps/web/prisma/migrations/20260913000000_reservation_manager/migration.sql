CREATE TABLE "reservation_days" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  "closedTimes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedById" TEXT,
  CONSTRAINT "reservation_days_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reservation_days_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "reservation_days_placeId_date_key" ON "reservation_days"("placeId", "date");

ALTER TABLE "reservations" ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 120;
UPDATE "reservations" AS r SET "durationMinutes" = p."reservationDuration"
  FROM "places" AS p WHERE r."placeId" = p."id";
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_duration_valid" CHECK ("durationMinutes" BETWEEN 1 AND 360);
