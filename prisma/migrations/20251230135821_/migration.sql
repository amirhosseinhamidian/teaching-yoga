/*
  Warnings:

  - You are about to drop the column `title` on the `ShopOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopOrder" DROP COLUMN "title",
ADD COLUMN     "shippingTitle" TEXT NOT NULL DEFAULT '';
