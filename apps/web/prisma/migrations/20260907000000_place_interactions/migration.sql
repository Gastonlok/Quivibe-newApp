CREATE TABLE "place_interactions" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "visitorKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "placeId" TEXT NOT NULL,
  CONSTRAINT "place_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "place_interactions_placeId_type_createdAt_idx"
  ON "place_interactions"("placeId", "type", "createdAt");

ALTER TABLE "place_interactions"
  ADD CONSTRAINT "place_interactions_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
