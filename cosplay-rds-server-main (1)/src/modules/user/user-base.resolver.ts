import { between } from '@common/util/date-between';
import config from '@config';
import { UserCOTTipResponse } from '@modules/cot-tip/dto/response/user-cot-tip';
import { NftCampaignResponse } from '@modules/nft-campaign/dto/response/nft-campaign';
import { NFTCampaign } from '@modules/nft-campaign/nft-campaign.model';
import { COTTipNFTDistributionState } from '@prisma/client';
import { ClassType, Resolver, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';

const { photoDomain } = config.file;

// TODO: type for any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UserBaseResolver = <T>(Cls: ClassType<T>): any => {
  @Resolver((of) => Cls, { isAbstract: true })
  @Service()
  abstract class UserBaseResolverClass {
    @FieldResolver((returns) => String, {
      nullable: true,
      description: 'ドメインを付与したアイコンのURLを返すFieldResolver。',
    })
    icon(@Root() object: T & { icon: string | null }): string | null {
      const { icon: iconUrl } = object;
      if (!iconUrl) return null;

      return `${photoDomain}${iconUrl}`;
    }

    @FieldResolver((returns) => NftCampaignResponse, {
      description: 'NFTキャンペーン対象者か否かを返すFieldResolver。',
      nullable: true,
    })
    activeCampaign(
      @Root()
      object: T & {
        createdAt: Date;
        updatedAt: Date;
        nftCampaigns: NFTCampaign[] | null;
        nftCampaign: NFTCampaign | null;
      },
    ): NFTCampaign | null {
      if (Array.isArray(object.nftCampaigns)) {
        const activeCampaigns = object.nftCampaigns.filter(({ start, end }) => between(start, end));

        return activeCampaigns.length > 0 ? activeCampaigns.slice(-1)[0] : null;
      }

      if (!object.nftCampaign) return null;
      const { start, end } = object.nftCampaign;
      const isBetween = between(start, end);

      return isBetween ? object.nftCampaign : null;
    }

    @FieldResolver((returns) => Boolean, {
      description: '事務所を持っているユーザか否かを返すFieldResolver。',
      nullable: true,
    })
    isOffice(
      @Root()
      object: T & {
        manageOfficeId: number | null;
      },
    ): boolean {
      return !!object.manageOfficeId;
    }

    @FieldResolver((returns) => Boolean, {
      description: 'COT投げ銭に対するNFT返礼に対応しているかどうか',
      nullable: true,
      deprecationReason: 'userTipNFTDistribute.enabled として集約',
    })
    isUserTipNFTDistribute(
      @Root()
      object: T & {
        cOTTipNFTDistributionState: COTTipNFTDistributionState | null;
      },
    ): boolean {
      return !!object.cOTTipNFTDistributionState;
    }

    @FieldResolver((returns) => UserCOTTipResponse, {
      description: 'COT投げ銭に対するNFT返礼情報',
      nullable: true,
    })
    userTipNFTDistribute(
      @Root()
      object: T & {
        cOTTipNFTDistributionState: COTTipNFTDistributionState | null;
      },
    ): UserCOTTipResponse | null {
      return {
        enabled: !!object.cOTTipNFTDistributionState,
        lowerCOT: !!object.cOTTipNFTDistributionState
          ? object.cOTTipNFTDistributionState.lowerCOT
          : '0',
      };
    }
  }

  return UserBaseResolverClass;
};
