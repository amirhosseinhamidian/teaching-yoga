-- AlterTable
ALTER TABLE "VideoProcessingJob" ADD COLUMN     "accessLevel" "VideoAccessLevel" NOT NULL DEFAULT 'REGISTERED',
ADD COLUMN     "uploadProgress" INTEGER NOT NULL DEFAULT 0;
