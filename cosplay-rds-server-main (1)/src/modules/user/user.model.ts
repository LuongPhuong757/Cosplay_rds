import { COTTipNFTDistributionState } from '@modules/cot-tip/cot-tip.model';
import { Membership } from '@modules/membership/membership.model';
import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { Post } from '@modules/post/post.model';
import { UserPrivate } from '@modules/user-private/user-private.model';
import { rankingUser } from '@modules/user/user.repository';
import { User as UserPrisma } from '@prisma/client';
import { UserFollow } from './user-follow.model';
import { UserProfileRanking } from './user-profile-ranking.model';

export type User = {
  posts?: Post[];
  userPrivate?: UserPrivate | null;
  following?: UserFollow[];
  followedBy?: UserFollow[];
  blocking?: UserFollow[];
  blockedBy?: UserFollow[];
  UserProfileRanking?: UserProfileRanking | null;
  membership?: Membership | null;
  activeCampaign?: NFTCampaign | null;
  nftCampaign?: NFTCampaign | null;
  cOTTipNFTDistributionState?: COTTipNFTDistributionState | null;
} & UserPrisma;

export type UserNewCosplayer = {
  profileRanking: { [key: string]: number | null };
  totalFollowing: number | 0;
  totalFollowedBy: number | 0;
  totalPosts: number | 0;
  isFollowing: boolean | false;
} & rankingUser;
