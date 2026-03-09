/*
  Warnings:

  - A unique constraint covering the columns `[name,address,officeNumber]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Apartment" ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_name_address_officeNumber_key" ON "Apartment"("name", "address", "officeNumber");
