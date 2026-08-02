-- CreateEnum
CREATE TYPE "VideoJobTargetType" AS ENUM ('SESSION_VIDEO', 'COURSE_INTRO');

-- AlterTable
ALTER TABLE "VideoProcessingJob" ADD COLUMN     "courseId" INTEGER,
ADD COLUMN     "courseTitle" TEXT,
ADD COLUMN     "targetType" "VideoJobTargetType" NOT NULL DEFAULT 'SESSION_VIDEO',
ALTER COLUMN "sessionId" DROP NOT NULL,
ALTER COLUMN "termId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "VideoProcessingJob_courseId_createdAt_idx" ON "VideoProcessingJob"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoProcessingJob_targetType_status_createdAt_idx" ON "VideoProcessingJob"("targetType", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoProcessingJob" ADD CONSTRAINT "VideoProcessingJob_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
