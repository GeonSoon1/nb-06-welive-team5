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
  - You are about to drop the column `dong` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ho` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentboardId` on the `VoteRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VoteRecord" DROP CONSTRAINT "VoteRecord_apartmentboardId_fkey";

-- DropIndex
DROP INDEX "Notice_authorId_idx";

-- DropIndex
DROP INDEX "VoteRecord_apartmentboardId_idx";

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
ALTER TABLE "User" DROP COLUMN "dong",
DROP COLUMN "ho",
ADD COLUMN     "apartmentUnitId" TEXT;

-- AlterTable
ALTER TABLE "VoteRecord" DROP COLUMN "apartmentboardId";

-- CreateTable
CREATE TABLE "ApartmentStructureGroup" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "dongList" TEXT NOT NULL,
    "startFloor" INTEGER NOT NULL,
    "maxFloor" INTEGER NOT NULL,
    "unitsPerFloor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApartmentStructureGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApartmentUnit" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "dong" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "ho" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApartmentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentUnit_apartmentId_dong_ho_key" ON "ApartmentUnit"("apartmentId", "dong", "ho");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- AddForeignKey
ALTER TABLE "ApartmentStructureGroup" ADD CONSTRAINT "ApartmentStructureGroup_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentUnit" ADD CONSTRAINT "ApartmentUnit_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_apartmentUnitId_fkey" FOREIGN KEY ("apartmentUnitId") REFERENCES "ApartmentUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
