/*
  Warnings:

  - You are about to drop the column `basePrice` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `isDiscountCode` on the `Course` table. All the data in the column will be lost.
  - The `price` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `courseId` on the `Term` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Term" DROP CONSTRAINT "Term_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "basePrice",
DROP COLUMN "isDiscountCode",
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Term" DROP COLUMN "courseId",
ADD COLUMN     "discount" INTEGER DEFAULT 0,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CourseTerm" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseTerm_id_key" ON "CourseTerm"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTerm_courseId_termId_key" ON "CourseTerm"("courseId", "termId");

-- AddForeignKey
ALTER TABLE "CourseTerm" ADD CONSTRAINT "CourseTerm_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTerm" ADD CONSTRAINT "CourseTerm_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
