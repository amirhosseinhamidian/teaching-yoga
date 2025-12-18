-- CreateEnum
CREATE TYPE "CoursePricingMode" AS ENUM ('TERM_ONLY', 'SUBSCRIPTION_ONLY', 'BOTH');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "pricingMode" "CoursePricingMode" NOT NULL DEFAULT 'TERM_ONLY';
