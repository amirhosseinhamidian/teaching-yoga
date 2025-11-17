-- CreateTable
CREATE TABLE "SessionTerm" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "termId" INTEGER NOT NULL,

    CONSTRAINT "SessionTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionTerm_sessionId_termId_key" ON "SessionTerm"("sessionId", "termId");

-- AddForeignKey
ALTER TABLE "SessionTerm" ADD CONSTRAINT "SessionTerm_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTerm" ADD CONSTRAINT "SessionTerm_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
