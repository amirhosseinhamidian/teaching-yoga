-- CreateEnum
CREATE TYPE "ProgressState" AS ENUM ('WATCHING', 'COMPLETED', 'INCOMPLETE');

-- AlterTable
ALTER TABLE "SessionProgress" ADD COLUMN     "isRewound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastWatchedPosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressState" "ProgressState" NOT NULL DEFAULT 'WATCHING';
