-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answerText" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "isAnswered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReadByUser" BOOLEAN NOT NULL DEFAULT false;
