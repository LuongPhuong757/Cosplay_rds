/*
  Warnings:

  - You are about to drop the column `issuerId` on the `NFT` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "NFT" DROP CONSTRAINT "NFT_issuerId_fkey";

-- AlterTable
ALTER TABLE "NFT" DROP COLUMN "issuerId";
