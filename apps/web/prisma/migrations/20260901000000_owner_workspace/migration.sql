-- Owner workspace: configurable reservation slots and anonymous place-visit analytics.

ALTER TABLE "places"
  ADD COLUMN "reservationStartTime" TEXT NOT NULL DEFAULT '11:00',
  ADD COLUMN "reservationEndTime" TEXT NOT NULL DEFAULT '23:00',
  ADD COLUMN "reservationInterval" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "place_visits" (
  "id" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "placeId" TEXT NOT NULL,

  CONSTRAINT "place_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "place_visits_placeId_visitedAt_idx"
  ON "place_visits"("placeId", "visitedAt");
CREATE INDEX "place_visits_visitorKey_visitedAt_idx"
  ON "place_visits"("visitorKey", "visitedAt");

ALTER TABLE "place_visits"
  ADD CONSTRAINT "place_visits_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
