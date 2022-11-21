-- CreateTable
CREATE TABLE "NFTPrivilegeOnUsers" (
    "userId" INTEGER NOT NULL,
    "nftPrivilegeId" INTEGER NOT NULL,
    "executionTimes" INTEGER NOT NULL,

    PRIMARY KEY ("userId","nftPrivilegeId")
);

-- AddForeignKey
ALTER TABLE "NFTPrivilegeOnUsers" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTPrivilegeOnUsers" ADD FOREIGN KEY ("nftPrivilegeId") REFERENCES "NFTPrivilege"("id") ON DELETE CASCADE ON UPDATE CASCADE;
