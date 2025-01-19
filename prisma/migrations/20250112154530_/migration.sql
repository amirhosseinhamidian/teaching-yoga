-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "courseId" INTEGER;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
