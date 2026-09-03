CREATE TABLE "review_reports" (
  "id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,

  CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_reports_reviewId_reporterId_key"
  ON "review_reports"("reviewId", "reporterId");
CREATE INDEX "review_reports_status_createdAt_idx"
  ON "review_reports"("status", "createdAt");

ALTER TABLE "review_reports"
  ADD CONSTRAINT "review_reports_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_reports"
  ADD CONSTRAINT "review_reports_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
