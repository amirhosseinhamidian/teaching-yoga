/*
  Warnings:

  - You are about to drop the column `postEnabled` on the `SiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `postShippingCost` on the `SiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `shopEnabled` on the `SiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `tehranCourierEnabled` on the `SiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `tehranCourierShippingCost` on the `SiteInfo` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ShopVisibility" AS ENUM ('OFF', 'ADMIN_ONLY', 'ALL');

-- AlterTable
ALTER TABLE "SiteInfo" DROP COLUMN "postEnabled",
DROP COLUMN "postShippingCost",
DROP COLUMN "shopEnabled",
DROP COLUMN "tehranCourierEnabled",
DROP COLUMN "tehranCourierShippingCost",
ADD COLUMN     "postFallbackBaseCost" INTEGER,
ADD COLUMN     "postFallbackCostPerKg" INTEGER,
ADD COLUMN     "shopVisibility" "ShopVisibility" NOT NULL DEFAULT 'ALL';
