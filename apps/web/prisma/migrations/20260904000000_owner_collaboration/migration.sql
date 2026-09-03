CREATE TABLE "place_collaborators" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'EDITOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "placeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "place_collaborators_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "place_collaborators_placeId_userId_key"
  ON "place_collaborators"("placeId", "userId");
CREATE INDEX "place_collaborators_userId_idx"
  ON "place_collaborators"("userId");

ALTER TABLE "place_collaborators"
  ADD CONSTRAINT "place_collaborators_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_collaborators"
  ADD CONSTRAINT "place_collaborators_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "owner_review_responses" (
  "id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,

  CONSTRAINT "owner_review_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "owner_review_responses_reviewId_key"
  ON "owner_review_responses"("reviewId");

ALTER TABLE "owner_review_responses"
  ADD CONSTRAINT "owner_review_responses_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "owner_review_responses"
  ADD CONSTRAINT "owner_review_responses_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
