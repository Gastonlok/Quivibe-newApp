-- Prevent duplicate reviews from the same account for the same place.
CREATE UNIQUE INDEX "reviews_authorId_placeId_key" ON "reviews"("authorId", "placeId");