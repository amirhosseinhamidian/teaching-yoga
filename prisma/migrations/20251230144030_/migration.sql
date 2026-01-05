/*
  Warnings:

  - A unique constraint covering the columns `[shopCartId]` on the table `ShopOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ShopOrder" ADD COLUMN     "postOptionKey" TEXT,
ADD COLUMN     "shippingMeta" JSONB,
ADD COLUMN     "shopCartId" INTEGER;

-- AlterTable
ALTER TABLE "ShopOrderItem" ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "sizeId" INTEGER,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrder_shopCartId_key" ON "ShopOrder"("shopCartId");

-- AddForeignKey
ALTER TABLE "ShopCartItem" ADD CONSTRAINT "ShopCartItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopCartItem" ADD CONSTRAINT "ShopCartItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_shopCartId_fkey" FOREIGN KEY ("shopCartId") REFERENCES "ShopCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
