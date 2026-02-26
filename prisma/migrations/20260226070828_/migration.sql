/*
  Warnings:

  - The values [SCHEDULED] on the enum `VoteStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `notifiedAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the `Apartmentboard` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contact]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `targetScope` on the `Vote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VoteStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'CLOSED');
ALTER TABLE "Vote" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vote" ALTER COLUMN "status" TYPE "VoteStatus_new" USING ("status"::text::"VoteStatus_new");
ALTER TYPE "VoteStatus" RENAME TO "VoteStatus_old";
ALTER TYPE "VoteStatus_new" RENAME TO "VoteStatus";
DROP TYPE "VoteStatus_old";
ALTER TABLE "Vote" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Apartment" DROP CONSTRAINT "Apartment_ApartmentboardId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_apartmentboardId_fkey";

-- DropForeignKey
ALTER TABLE "Notice" DROP CONSTRAINT "Notice_apartmentboardId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_apartmentboardId_fkey";

-- DropForeignKey
ALTER TABLE "VoteRecord" DROP CONSTRAINT "VoteRecord_apartmentboardId_fkey";

-- DropIndex
DROP INDEX "Notification_isChecked_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "notifiedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "targetScope",
ADD COLUMN     "targetScope" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Apartmentboard";

-- CreateTable
CREATE TABLE "ApartmentBoard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApartmentBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isChecked_idx" ON "Notification"("userId", "isChecked");

-- CreateIndex
CREATE UNIQUE INDEX "User_contact_key" ON "User"("contact");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ApartmentboardId_fkey" FOREIGN KEY ("ApartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "ApartmentBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
