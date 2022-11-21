-- CreateTable
CREATE TABLE "NFTCampaign" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "contract" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NFTCampaign_userId_unique" ON "NFTCampaign"("userId");

-- AddForeignKey
ALTER TABLE "NFTCampaign" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
