-- CreateTable
CREATE TABLE "COTTipDistributionTriggerdTxHashes" (
    "txHash" VARCHAR(256) NOT NULL,
    "postId" INTEGER NOT NULL,
    "photoId" INTEGER NOT NULL,

    PRIMARY KEY ("txHash")
);
