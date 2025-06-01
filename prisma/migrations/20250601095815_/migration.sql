/*
  Warnings:

  - You are about to drop the column `email` on the `Newsletter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Newsletter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `Newsletter` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Newsletter_email_idx";

-- DropIndex
DROP INDEX "Newsletter_email_key";

-- AlterTable
ALTER TABLE "Newsletter" DROP COLUMN "email",
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_phone_key" ON "Newsletter"("phone");

-- CreateIndex
CREATE INDEX "Newsletter_phone_idx" ON "Newsletter"("phone");
