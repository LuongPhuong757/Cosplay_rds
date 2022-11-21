/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `UserPrivate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserPrivate" ADD COLUMN     "emailVerifyToken" VARCHAR(128);

-- CreateIndex
CREATE UNIQUE INDEX "UserPrivate.emailVerifyToken_unique" ON "UserPrivate"("emailVerifyToken");
