-- AlterTable
ALTER TABLE "UserPrivate" ADD COLUMN     "twitterAccessToken" TEXT,
ADD COLUMN     "twitterAccount" TEXT,
ADD COLUMN     "twitterCodeVerifier" TEXT,
ADD COLUMN     "twitterOAuthState" TEXT,
ADD COLUMN     "twitterRefreshToken" TEXT;
