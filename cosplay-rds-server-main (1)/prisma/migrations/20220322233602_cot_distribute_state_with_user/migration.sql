/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `COTTipNFTDistributionState` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "COTTipNFTDistributionState" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "COTTipNFTDistributionState_userId_unique" ON "COTTipNFTDistributionState"("userId");

-- AddForeignKey
ALTER TABLE "COTTipNFTDistributionState" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "User_manageOfficeId_unique" RENAME TO "User.manageOfficeId_unique";
