-- CreateTable
CREATE TABLE "NFTPrivilege" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "expired" TIMESTAMP(3) NOT NULL,
    "nftCampaignId" INTEGER,
    "emailBody" VARCHAR(2048) NOT NULL,
    "limitExecutionTimes" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTPrivilegeOnNFTs" (
    "nftId" INTEGER NOT NULL,
    "nftPrivilegeId" INTEGER NOT NULL,
    "required" INTEGER NOT NULL,

    PRIMARY KEY ("nftId","nftPrivilegeId")
);

-- AddForeignKey
ALTER TABLE "NFTPrivilege" ADD FOREIGN KEY ("nftCampaignId") REFERENCES "NFTCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTPrivilegeOnNFTs" ADD FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTPrivilegeOnNFTs" ADD FOREIGN KEY ("nftPrivilegeId") REFERENCES "NFTPrivilege"("id") ON DELETE CASCADE ON UPDATE CASCADE;
