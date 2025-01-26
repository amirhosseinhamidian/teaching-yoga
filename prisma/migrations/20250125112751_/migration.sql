-- CreateTable
CREATE TABLE "SitemapSetting" (
    "id" SERIAL NOT NULL,
    "section" TEXT NOT NULL,
    "type" TEXT,
    "changefreq" TEXT NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitemapSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SitemapSetting_section_type_key" ON "SitemapSetting"("section", "type");
