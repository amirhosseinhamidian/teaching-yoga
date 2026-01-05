-- CreateEnum
CREATE TYPE "ReturnRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'COLOR_ISSUE', 'NOT_AS_DESCRIBED', 'OTHER');

-- CreateTable
CREATE TABLE "ShopReturnRequest" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "reason" "ReturnReason" NOT NULL,
    "description" TEXT,
    "status" "ReturnRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopReturnRequest_orderItemId_key" ON "ShopReturnRequest"("orderItemId");

-- CreateIndex
CREATE INDEX "ShopReturnRequest_userId_idx" ON "ShopReturnRequest"("userId");

-- CreateIndex
CREATE INDEX "ShopReturnRequest_orderId_idx" ON "ShopReturnRequest"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopReturnRequest_orderId_orderItemId_key" ON "ShopReturnRequest"("orderId", "orderItemId");

-- AddForeignKey
ALTER TABLE "ShopReturnRequest" ADD CONSTRAINT "ShopReturnRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReturnRequest" ADD CONSTRAINT "ShopReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopReturnRequest" ADD CONSTRAINT "ShopReturnRequest_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "ShopOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
