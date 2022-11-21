-- AlterTable
ALTER TABLE "ScoreLog" ADD COLUMN     "paymentIntentId" TEXT;

-- AlterIndex
ALTER INDEX "User.manageOfficeId_unique" RENAME TO "User_manageOfficeId_unique";
