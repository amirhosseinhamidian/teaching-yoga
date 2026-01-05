/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ShopCartItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ShopCartItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Size` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ShopCartItem" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "Size_name_key" ON "Size"("name");
