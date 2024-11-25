/*
  Warnings:

  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `videoUrl` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[videoId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VideoAccessLevel" AS ENUM ('PUBLIC', 'REGISTERED', 'PURCHASED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "videoUrl",
ADD COLUMN     "videoId" INTEGER,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Session_id_seq";

-- CreateTable
CREATE TABLE "SessionVideo" (
    "id" SERIAL NOT NULL,
    "videoKey" TEXT NOT NULL,
    "accessLevel" "VideoAccessLevel" NOT NULL DEFAULT 'REGISTERED',
    "status" "VideoStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timeWatched" INTEGER NOT NULL DEFAULT 0,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionVideo_id_key" ON "SessionVideo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SessionProgress_userId_sessionId_key" ON "SessionProgress"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_videoId_key" ON "Session"("videoId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "SessionVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
