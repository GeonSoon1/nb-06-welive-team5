/*
  Warnings:

  - You are about to drop the column `endComplexNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `endDongNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `endFloorNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `endHoNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `startComplexNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `startDongNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `startFloorNumber` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `startHoNumber` on the `Apartment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "endComplexNumber",
DROP COLUMN "endDongNumber",
DROP COLUMN "endFloorNumber",
DROP COLUMN "endHoNumber",
DROP COLUMN "startComplexNumber",
DROP COLUMN "startDongNumber",
DROP COLUMN "startFloorNumber",
DROP COLUMN "startHoNumber";

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ApartmentInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startComplexNumber" INTEGER NOT NULL DEFAULT 1,
    "endComplexNumber" INTEGER NOT NULL,
    "startDongNumber" INTEGER NOT NULL DEFAULT 1,
    "endDongNumber" INTEGER NOT NULL,
    "startFloorNumber" INTEGER NOT NULL DEFAULT 1,
    "endFloorNumber" INTEGER NOT NULL,
    "startHoNumber" INTEGER NOT NULL DEFAULT 1,
    "endHoNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApartmentInfo_pkey" PRIMARY KEY ("id")
);
