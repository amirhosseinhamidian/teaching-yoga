-- Video upload jobs are owned by the authenticated admin who created them.
-- Existing rows remain NULL and are claimed lazily on first exact access/conflict.
ALTER TABLE "VideoProcessingJob"
ADD COLUMN "createdByUserId" TEXT;

CREATE INDEX "VideoProcessingJob_createdByUserId_status_createdAt_idx"
ON "VideoProcessingJob"("createdByUserId", "status", "createdAt");
