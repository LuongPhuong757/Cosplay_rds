/*
  Warnings:

  - A unique constraint covering the columns `[manageOfficeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OfficeRequestStatus" AS ENUM ('REQUESTING', 'APPROVED', 'RESTRUCTURED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "belongOfficeId" INTEGER,
ADD COLUMN     "manageOfficeId" INTEGER;

-- CreateTable
CREATE TABLE "Office" (
    "id" SERIAL NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeRequest" (
    "id" SERIAL NOT NULL,
    "officeId" INTEGER NOT NULL,
    "layerId" INTEGER NOT NULL,
    "status" "OfficeRequestStatus" NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "restructuredAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_manageOfficeId_unique" ON "User"("manageOfficeId");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("manageOfficeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("belongOfficeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeRequest" ADD FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeRequest" ADD FOREIGN KEY ("layerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
