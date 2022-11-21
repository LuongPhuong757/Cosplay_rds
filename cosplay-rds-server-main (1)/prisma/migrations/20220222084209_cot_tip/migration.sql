-- CreateTable
CREATE TABLE "COTTipNFTDistributionState" (
    "targetCosplayer" VARCHAR(256) NOT NULL,
    "targetERC721" VARCHAR(256) NOT NULL,
    "lowerCOT" INTEGER NOT NULL,

    PRIMARY KEY ("targetCosplayer")
);

-- CreateTable
CREATE TABLE "COTTipTriggerdTxHashes" (
    "txHash" VARCHAR(256) NOT NULL,
    "nftDistributed" BOOLEAN NOT NULL,

    PRIMARY KEY ("txHash")
);
