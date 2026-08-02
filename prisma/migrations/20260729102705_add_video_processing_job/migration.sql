-- CreateEnum
CREATE TYPE "VideoJobStatus" AS ENUM ('UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING', 'READY', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "VideoProcessingJob" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourcePath" TEXT,
    "outputKey" TEXT,
    "status" "VideoJobStatus" NOT NULL DEFAULT 'UPLOADING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProcessingJob_sessionId_createdAt_idx" ON "VideoProcessingJob"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoProcessingJob_status_createdAt_idx" ON "VideoProcessingJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoProcessingJob" ADD CONSTRAINT "VideoProcessingJob_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
