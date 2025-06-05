-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "SupportSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SupportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
