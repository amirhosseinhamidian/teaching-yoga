/*
  Warnings:

  - A unique constraint covering the columns `[shortAddress]` on the table `Article` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Article_shortAddress_key" ON "Article"("shortAddress");
