-- CreateTable
CREATE TABLE "VisitLog" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "referrer" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);
