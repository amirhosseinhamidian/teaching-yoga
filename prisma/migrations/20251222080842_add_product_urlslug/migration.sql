/*
  Warnings:

  - Added the required column `urlSlug` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "urlSlug" TEXT NOT NULL;
