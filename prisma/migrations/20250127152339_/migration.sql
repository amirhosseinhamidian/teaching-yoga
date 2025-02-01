/*
  Warnings:

  - You are about to drop the column `startDate` on the `DiscountCode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DiscountCode" DROP COLUMN "startDate";

-- CreateTable
CREATE TABLE "UserDiscount" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "discountCodeId" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscount_userId_discountCodeId_key" ON "UserDiscount"("userId", "discountCodeId");

-- AddForeignKey
ALTER TABLE "UserDiscount" ADD CONSTRAINT "UserDiscount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscount" ADD CONSTRAINT "UserDiscount_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
