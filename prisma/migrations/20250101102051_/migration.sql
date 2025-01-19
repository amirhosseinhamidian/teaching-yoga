/*
  Warnings:

  - Added the required column `cover` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtitle` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "cover" TEXT NOT NULL,
ADD COLUMN     "subtitle" TEXT NOT NULL;
