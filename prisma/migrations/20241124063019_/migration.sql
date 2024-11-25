/*
  Warnings:

  - You are about to drop the column `isRewound` on the `SessionProgress` table. All the data in the column will be lost.
  - You are about to drop the column `lastWatchedPosition` on the `SessionProgress` table. All the data in the column will be lost.
  - You are about to drop the column `progressState` on the `SessionProgress` table. All the data in the column will be lost.
  - You are about to drop the column `timeWatched` on the `SessionProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SessionProgress" DROP COLUMN "isRewound",
DROP COLUMN "lastWatchedPosition",
DROP COLUMN "progressState",
DROP COLUMN "timeWatched";

-- DropEnum
DROP TYPE "ProgressState";
