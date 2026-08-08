-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "homeOrder" INTEGER,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Comment_showOnHome_homeOrder_idx" ON "Comment"("showOnHome", "homeOrder");
