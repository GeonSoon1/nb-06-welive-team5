/*
  Warnings:

  - The values [INSPECTION,URGENT,VOTE] on the enum `NoticeCategory` will be removed. If these variants are still used in the database, this will fail.
  - The `apartmentStatus` column on the `Apartment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `apartmentId` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `VoteRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[adminId]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ApartmentboardId]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ApartmentboardId` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apartmentboardId` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apartmentboardId` to the `Notice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apartmentboardId` to the `Vote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apartmentboardId` to the `VoteRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResidenceStatus" AS ENUM ('RESIDENCE', 'NO_RESIDENCE');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('NOTICE', 'COMPLAINT', 'VOTE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'SIGNUP_REQ', 'COMPLAINT_REQ', 'COMPLAINT_IN_PROGRESS', 'COMPLAINT_RESOLVED', 'COMPLAINT_REJECTED', 'NOTICE_REG', 'VOTE_REG', 'VOTE_CLOSED', 'VOTE_RESULT', 'SYSTEM', 'TEST');

-- AlterEnum
ALTER TYPE "JoinStatus" ADD VALUE 'NEED_UPDATE';

-- AlterEnum
BEGIN;
CREATE TYPE "NoticeCategory_new" AS ENUM ('MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'ETC', 'GENERAL');
ALTER TABLE "Notice" ALTER COLUMN "category" TYPE "NoticeCategory_new" USING ("category"::text::"NoticeCategory_new");
ALTER TYPE "NoticeCategory" RENAME TO "NoticeCategory_old";
ALTER TYPE "NoticeCategory_new" RENAME TO "NoticeCategory";
DROP TYPE "NoticeCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Notice" DROP CONSTRAINT "Notice_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "VoteRecord" DROP CONSTRAINT "VoteRecord_apartmentId_fkey";

-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "ApartmentboardId" TEXT NOT NULL,
ADD COLUMN     "adminId" TEXT,
DROP COLUMN "apartmentStatus",
ADD COLUMN     "apartmentStatus" "ApartmentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "voteId" TEXT;

-- AlterTable
ALTER TABLE "Complaint" DROP COLUMN "apartmentId",
ADD COLUMN     "apartmentboardId" TEXT NOT NULL,
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "apartmentId",
ADD COLUMN     "apartmentboardId" TEXT NOT NULL,
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "residenceStatus" "ResidenceStatus" NOT NULL DEFAULT 'NO_RESIDENCE';

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "apartmentId",
ADD COLUMN     "apartmentboardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VoteOption" ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VoteRecord" DROP COLUMN "apartmentId",
ADD COLUMN     "apartmentboardId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Apartmentboard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartmentboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "noticeId" TEXT,
    "complaintId" TEXT,
    "voteId" TEXT,
    "userId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "BoardType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "category" "NotificationType" NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "noticeId" TEXT,
    "voteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isChecked_idx" ON "Notification"("isChecked");

-- CreateIndex
CREATE INDEX "Event_apartmentId_idx" ON "Event"("apartmentId");

-- CreateIndex
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_adminId_key" ON "Apartment"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_ApartmentboardId_key" ON "Apartment"("ApartmentboardId");

-- CreateIndex
CREATE INDEX "Comment_noticeId_idx" ON "Comment"("noticeId");

-- CreateIndex
CREATE INDEX "Comment_complaintId_idx" ON "Comment"("complaintId");

-- CreateIndex
CREATE INDEX "Comment_voteId_idx" ON "Comment"("voteId");

-- CreateIndex
CREATE INDEX "Complaint_apartmentboardId_idx" ON "Complaint"("apartmentboardId");

-- CreateIndex
CREATE INDEX "Complaint_authorId_idx" ON "Complaint"("authorId");

-- CreateIndex
CREATE INDEX "Notice_apartmentboardId_idx" ON "Notice"("apartmentboardId");

-- CreateIndex
CREATE INDEX "Notice_authorId_idx" ON "Notice"("authorId");

-- CreateIndex
CREATE INDEX "User_apartmentId_idx" ON "User"("apartmentId");

-- CreateIndex
CREATE INDEX "Vote_apartmentboardId_idx" ON "Vote"("apartmentboardId");

-- CreateIndex
CREATE INDEX "VoteRecord_apartmentboardId_idx" ON "VoteRecord"("apartmentboardId");

-- CreateIndex
CREATE INDEX "VoteRecord_voteId_idx" ON "VoteRecord"("voteId");

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_ApartmentboardId_fkey" FOREIGN KEY ("ApartmentboardId") REFERENCES "Apartmentboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "Apartmentboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "Apartmentboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "Apartmentboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_apartmentboardId_fkey" FOREIGN KEY ("apartmentboardId") REFERENCES "Apartmentboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
