-- AlterEnum
ALTER TYPE "INFO_TYPE" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "receivedId" DROP NOT NULL;
