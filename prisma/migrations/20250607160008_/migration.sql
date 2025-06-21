-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('VIDEO', 'AUDIO');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "type" "SessionType" NOT NULL DEFAULT 'VIDEO';
