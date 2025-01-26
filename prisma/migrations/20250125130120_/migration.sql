/*
  Warnings:

  - You are about to drop the column `type` on the `SitemapSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[section]` on the table `SitemapSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SitemapSetting_section_type_key";

-- AlterTable
ALTER TABLE "SitemapSetting" DROP COLUMN "type";

-- CreateIndex
CREATE UNIQUE INDEX "SitemapSetting_section_key" ON "SitemapSetting"("section");
