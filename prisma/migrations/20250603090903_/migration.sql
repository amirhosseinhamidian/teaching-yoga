-- DropIndex
DROP INDEX "SupportMessage_createdAt_idx";

-- DropIndex
DROP INDEX "SupportMessage_userId_idx";

-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN     "replyToId" INTEGER;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "SupportMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
