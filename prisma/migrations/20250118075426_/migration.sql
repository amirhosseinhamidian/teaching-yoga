-- CreateTable
CREATE TABLE "SiteInfo" (
    "id" SERIAL NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "socialLinks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteInfo_pkey" PRIMARY KEY ("id")
);
