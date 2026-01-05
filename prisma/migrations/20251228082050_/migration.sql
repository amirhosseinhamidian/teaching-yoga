/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `ShopOrder` table. All the data in the column will be lost.
  - The `shippingMethod` column on the `ShopOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ShopOrder" DROP COLUMN "shippingAddress",
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "deliverySlot" TEXT,
ADD COLUMN     "shippingCost" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "shippingMethod",
ADD COLUMN     "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'POST';

-- AlterTable
ALTER TABLE "SiteInfo" ADD COLUMN     "postEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "postShippingCost" INTEGER,
ADD COLUMN     "shopLeadTimeDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tehranCourierEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tehranCourierShippingCost" INTEGER;
