-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packageBoxTypeId" INTEGER;

-- CreateTable
CREATE TABLE "PostexBoxCache" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "length" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostexBoxCache_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_packageBoxTypeId_fkey" FOREIGN KEY ("packageBoxTypeId") REFERENCES "PostexBoxCache"("id") ON DELETE SET NULL ON UPDATE CASCADE;
