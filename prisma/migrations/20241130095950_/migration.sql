/*
  Warnings:

  - The `duration` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "sessionCount" SET DEFAULT 0,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0;
