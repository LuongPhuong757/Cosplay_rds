-- DropIndex
DROP INDEX "NFTCampaign_userId_unique";

-- CreateTable
CREATE TABLE "NFT" (
    "id" SERIAL NOT NULL,
    "tokenID" INTEGER NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issuerId" INTEGER NOT NULL,
    "campaignId" INTEGER,
    "rarity" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHasNFT" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nftId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "shipped" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NFT" ADD FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD FOREIGN KEY ("campaignId") REFERENCES "NFTCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHasNFT" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHasNFT" ADD FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterIndex
ALTER INDEX "Membership_priceId_unique" RENAME TO "Membership.priceId_unique";

-- AlterIndex
ALTER INDEX "Membership_userId_unique" RENAME TO "Membership.userId_unique";

-- AlterIndex
ALTER INDEX "ReportDetail_reportId_unique" RENAME TO "ReportDetail.reportId_unique";

-- AlterIndex
ALTER INDEX "Superchat_commentId_unique" RENAME TO "Superchat.commentId_unique";

-- AlterIndex
ALTER INDEX "Superchat_priceId_unique" RENAME TO "Superchat.priceId_unique";

-- AlterIndex
ALTER INDEX "Tag_eventId_unique" RENAME TO "Tag.eventId_unique";

-- AlterIndex
ALTER INDEX "UserPrivate_userId_unique" RENAME TO "UserPrivate.userId_unique";

-- AlterIndex
ALTER INDEX "UserProfileRanking_userId_unique" RENAME TO "UserProfileRanking.userId_unique";
