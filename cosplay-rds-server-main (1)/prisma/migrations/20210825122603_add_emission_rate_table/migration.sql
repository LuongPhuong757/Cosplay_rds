/*
  Warnings:
  - Added the required column `emissionRateTable` to the `NFTCampaign` table without a default value. This is not possible if the table is not empty.
*/
-- AlterTable
ALTER TABLE "NFTCampaign" ADD COLUMN     "emissionRateTable" JSONB NOT NULL;
