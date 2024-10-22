-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'BEGINNER_INTERMEDIATE', 'INTERMEDIATE_ADVANCED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS');

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "basePrice" TEXT,
    "isDiscountCode" BOOLEAN NOT NULL DEFAULT false,
    "isHighPriority" BOOLEAN NOT NULL DEFAULT false,
    "shortAddress" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "duration" TEXT NOT NULL,
    "level" "CourseLevel" NOT NULL,
    "participants" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "status" "CourseStatus" NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "introVideoUrl" TEXT,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "termId" INTEGER NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_id_key" ON "Course"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Course_shortAddress_key" ON "Course"("shortAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Term_id_key" ON "Term"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
