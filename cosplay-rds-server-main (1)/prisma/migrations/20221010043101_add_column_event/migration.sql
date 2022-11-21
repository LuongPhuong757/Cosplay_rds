-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "applicationMethod" VARCHAR(1024),
ADD COLUMN     "eventDetail" VARCHAR(1024),
ADD COLUMN     "note" VARCHAR(1024);
