-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FREE';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "authority" DROP NOT NULL;
