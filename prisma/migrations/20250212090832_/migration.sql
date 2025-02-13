-- DropForeignKey
ALTER TABLE "CartCourse" DROP CONSTRAINT "CartCourse_cartId_fkey";

-- AddForeignKey
ALTER TABLE "CartCourse" ADD CONSTRAINT "CartCourse_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
