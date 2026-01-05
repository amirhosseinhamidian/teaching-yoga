/*
  Warnings:

  - You are about to drop the column `shippingCost` on the `ShopOrder` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `ShopOrder` table. All the data in the column will be lost.
  - Added the required column `address1` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('POST', 'COURIER_COD');

-- AlterTable
ALTER TABLE "ShopOrder" DROP COLUMN "shippingCost",
DROP COLUMN "total",
ADD COLUMN     "address1" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payableCOD" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payableOnline" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT NOT NULL,
ALTER COLUMN "subtotal" SET DEFAULT 0;
