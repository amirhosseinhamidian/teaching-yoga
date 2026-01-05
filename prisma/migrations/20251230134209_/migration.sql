/*
  Warnings:

  - Added the required column `title` to the `ShopOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShopOrder" ADD COLUMN     "title" TEXT NOT NULL;
