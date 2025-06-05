-- DropForeignKey
ALTER TABLE "SupportMessage" DROP CONSTRAINT "SupportMessage_userId_fkey";

-- AlterTable
ALTER TABLE "SupportMessage" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
