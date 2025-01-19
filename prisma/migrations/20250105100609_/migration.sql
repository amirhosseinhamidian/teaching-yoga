-- CreateTable
CREATE TABLE "CartCourse" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "CartCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartCourse_id_key" ON "CartCourse"("id");

-- AddForeignKey
ALTER TABLE "CartCourse" ADD CONSTRAINT "CartCourse_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartCourse" ADD CONSTRAINT "CartCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
