/*
  Warnings:

  - You are about to drop the column `interval` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - Added the required column `durationInDays` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intervalLabel` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "interval",
ADD COLUMN     "discountAmount" INTEGER DEFAULT 0,
ADD COLUMN     "durationInDays" INTEGER NOT NULL,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "intervalLabel" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SubscriptionInterval";
