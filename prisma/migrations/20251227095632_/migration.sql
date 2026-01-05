-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('ALL', 'COURSE', 'PRODUCT', 'PRODUCT_CATEGORY');

-- AlterTable
ALTER TABLE "DiscountCode" ADD COLUMN     "appliesTo" "DiscountScope" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "productCategoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
