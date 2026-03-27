/*
  Warnings:

  - You are about to drop the column `endTime` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Vote` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Vote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;
