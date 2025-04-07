/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Podcast` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Podcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Podcast" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Podcast_slug_key" ON "Podcast"("slug");
