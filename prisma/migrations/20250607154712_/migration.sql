/*
  Warnings:

  - A unique constraint covering the columns `[audioId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "audioId" INTEGER;

-- CreateTable
CREATE TABLE "SessionAudio" (
    "id" SERIAL NOT NULL,
    "audioKey" TEXT NOT NULL,
    "accessLevel" "VideoAccessLevel" NOT NULL DEFAULT 'REGISTERED',
    "status" "VideoStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionAudio_id_key" ON "SessionAudio"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_audioId_key" ON "Session"("audioId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "SessionAudio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
