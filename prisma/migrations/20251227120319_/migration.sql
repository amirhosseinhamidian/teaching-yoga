-- AlterTable
ALTER TABLE "ShopCart" ADD COLUMN     "discountAppliedAt" TIMESTAMP(3),
ADD COLUMN     "discountCodeAmount" INTEGER,
ADD COLUMN     "discountCodeId" INTEGER;
