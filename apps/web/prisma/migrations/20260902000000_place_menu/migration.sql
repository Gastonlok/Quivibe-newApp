-- Restaurant menu, managed by the place owner and optionally visible to visitors.

ALTER TABLE "places"
  ADD COLUMN "menuVisible" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "menu_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" TEXT,
  "category" TEXT,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "placeId" TEXT NOT NULL,

  CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "menu_items_placeId_sortOrder_idx"
  ON "menu_items"("placeId", "sortOrder");

ALTER TABLE "menu_items"
  ADD CONSTRAINT "menu_items_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
