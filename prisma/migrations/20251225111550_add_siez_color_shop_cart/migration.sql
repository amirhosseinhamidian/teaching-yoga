/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,colorId,sizeId]` on the table `ShopCartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ShopCartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "ShopCartItem" ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "sizeId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ShopCartItem_cartId_productId_colorId_sizeId_key" ON "ShopCartItem"("cartId", "productId", "colorId", "sizeId");
