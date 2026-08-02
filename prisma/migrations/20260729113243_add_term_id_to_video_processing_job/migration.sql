/*
  Warnings:

  - Added the required column `termId` to the `VideoProcessingJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VideoProcessingJob" ADD COLUMN     "termId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "VideoProcessingJob_termId_sessionId_idx" ON "VideoProcessingJob"("termId", "sessionId");
