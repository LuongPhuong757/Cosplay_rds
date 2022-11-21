/*
  Warnings:

  - The values [ADMIN] on the enum `INFO_TYPE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "INFO_TYPE_new" AS ENUM ('FAV', 'TAG', 'TAG_FAV', 'COMMENT', 'FOLLOW', 'SUPERCHAT', 'MEMBERSHIP', 'MENTION', 'ANNOUNCEMENT');
ALTER TABLE "Notification" ALTER COLUMN "infoType" TYPE "INFO_TYPE_new" USING ("infoType"::text::"INFO_TYPE_new");
ALTER TYPE "INFO_TYPE" RENAME TO "INFO_TYPE_old";
ALTER TYPE "INFO_TYPE_new" RENAME TO "INFO_TYPE";
DROP TYPE "INFO_TYPE_old";
COMMIT;
