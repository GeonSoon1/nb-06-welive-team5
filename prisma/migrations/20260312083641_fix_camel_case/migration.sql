/*
  Warnings:

  - You are about to drop the column `ApartmentboardId` on the `Apartment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apartmentboardId]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apartmentboardId` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Apartment" DROP CONSTRAINT "Apartment_ApartmentboardId_fkey";

-- DropIndex
DROP INDEX "Apartment_ApartmentboardId_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "ApartmentboardId",
ADD COLUMN     "apartmentboardId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_apartmentboardId_key" ON "Apartment"("apartmentboardId");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
