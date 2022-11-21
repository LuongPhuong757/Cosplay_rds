import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { extractIds } from '@common/util/extract-ids';
import config from '@config';
import { WebhookEvent } from '@interfaces';
import { NFTPrivilegeOnNFTs } from '@modules/nft-privilege-on-nft/nft-privilege-on-nft.model';
import { NFTPrivilegeOnUsersRepository } from '@modules/nft-privilege-on-user/nft-privilege-on-user.repository';
import { NFT } from '@modules/nft/nft.model';
import { UserHasNFT } from '@modules/user-has-nft/user-has-nft.model';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { UserHasNftService } from '@modules/user-has-nft/user-has-nft.service';
import { User } from '@modules/user/user.model';
import { SqsService } from '@providers/sqs.provider';
import { GeneratorService } from '@services/generator.service';
import { ForbiddenError } from 'apollo-server-express';
import dayjs from 'dayjs';
import { Service } from 'typedi';
import { ExecutePrivilegeInput } from './dto/input/execute-privilege';
import { NFTPrivilege } from './nft-privilege.model';
import { NFTPrivilegeRepository } from './nft-privilege.repository';

const { sqsWebhookStripeQueueUrl } = config.aws;

@Service()
export class NFTPrivilegeService {
  constructor(
    private readonly nFTPrivilegeRepository: NFTPrivilegeRepository,
    private readonly nFTPrivilegeOnUsersRepository: NFTPrivilegeOnUsersRepository,
    private readonly userHasNftService: UserHasNftService,
    private readonly userHasNftRepository: UserHasNftRepository,
    private readonly sqsService: SqsService,
    private readonly generatorService: GeneratorService,
  ) {}

  async getNftPrivilegesByCampaignId(nftCampaignId: number, user?: User): Promise<NFTPrivilege[]> {
    const nftPrivileges = await this.nFTPrivilegeRepository.findMany({
      where: {
        nftCampaignId,
      },
      include: {
        nfts: {
          include: {
            nft: true,
          },
        },
        nftCampaign: {
          include: {
            user: true,
          },
        },
        nftPrivilegeOnUsers: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
      },
    });
    if (nftPrivileges.length === 0) {
      throw new Error('nft campaign has no privilege');
    }

    const userHasNfts = user
      ? await this.userHasNftService.getUserCampaignNfts(user.id, nftCampaignId)
      : [];

    return nftPrivileges.map((nftPrivilege) =>
      this.addAmountAndShippedToNftPrivilege(nftPrivilege, userHasNfts),
    );
  }

  async getNftPrivilegesByNftId(nftId: number, user?: User): Promise<NFTPrivilege[]> {
    const nftPrivileges = await this.nFTPrivilegeRepository.findMany({
      where: {
        nfts: {
          some: {
            nftId,
          },
        },
      },
      include: {
        nfts: {
          include: {
            nft: true,
          },
        },
        nftCampaign: {
          include: {
            user: true,
          },
        },
        nftPrivilegeOnUsers: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
      },
    });
    if (nftPrivileges.length === 0) {
      return [];
    }
    const { nftCampaignId } = nftPrivileges[0];
    if (!nftCampaignId) {
      throw new Error('nft privilege has no campaign');
    }

    const userHasNfts = user
      ? await this.userHasNftService.getUserCampaignNfts(user.id, nftCampaignId)
      : [];

    return nftPrivileges.map((nftPrivilege) =>
      this.addAmountAndShippedToNftPrivilege(nftPrivilege, userHasNfts),
    );
  }

  async getNftPrivilege(nftPrivilegeId: number, user?: User): Promise<NFTPrivilege> {
    const args = {
      where: {
        id: nftPrivilegeId,
      },
      include: {
        nftCampaign: {
          include: {
            user: true,
          },
        },
        nfts: {
          include: {
            nft: true,
          },
        },
        nftPrivilegeOnUsers: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
      },
    };
    const nftPrivilege = await this.nFTPrivilegeRepository.findUnique(args);
    if (!nftPrivilege) {
      throw new Error('NFT privilege was not found');
    }

    const userHasNfts = user
      ? await this.userHasNftService.getUserCampaignNfts(
          user.id,
          nftPrivilege.nftCampaignId as number,
        )
      : [];

    return this.addAmountAndShippedToNftPrivilege(nftPrivilege, userHasNfts);
  }

  async executePrivilege(
    user: User,
    { nftPrivilegeId }: ExecutePrivilegeInput,
  ): Promise<ResultResponse> {
    try {
      const { id: userId } = user;
      const nftPrivilege = await this.nFTPrivilegeRepository.findFirst({
        where: {
          id: nftPrivilegeId,
        },
        include: {
          nfts: true,
          nftPrivilegeOnUsers: true,
          nftCampaign: {
            include: {
              user: {
                include: {
                  userPrivate: true,
                },
              },
            },
          },
        },
      });
      if (!nftPrivilege) {
        throw new Error(`not found nft privilege nftPrivilegeId: ${nftPrivilegeId}`);
      }
      if (this.isBlockUser(user, nftPrivilege)) {
        throw new ForbiddenError('you have been blocked.');
      }
      if (nftPrivilege.expired <= new Date()) {
        throw new Error(`this ntf privilege already exipred`);
      }
      const userEmailsAndNames = this.getUserEmailsAndNames(user, nftPrivilege);

      const userHasNfts = await this.userHasNftRepository.findMany({
        where: {
          userId,
          nft: {
            id: {
              in: nftPrivilege.nfts?.map((nft) => nft?.nftId),
            },
            campaignId: nftPrivilege.nftCampaignId as number,
          },
        },
      });

      const hasAllPrivilegeNfts = this.checkPrivilegeNftSize(nftPrivilege, userHasNfts);
      if (!hasAllPrivilegeNfts) {
        throw new Error('collect all the NFTs you need to execute privilege');
      }

      const userHasPrivilegeNfts = this.addAmountAndShippedRequiredToUserHasNFT(
        nftPrivilege,
        userHasNfts,
      );

      const isExecutable = this.checkNftPrivilegeAmount(userHasPrivilegeNfts);
      if (!isExecutable) {
        throw new Error('you dont have enough nft amount');
      }

      const isLimit = this.checkNftPrivilegeExecutionTimes(nftPrivilege);
      if (!isLimit) {
        throw new Error('execution times is already reach limit');
      }

      await this.executeNFTPrivilege(userId, nftPrivilegeId, userHasPrivilegeNfts);

      const payload = JSON.stringify({
        ...userEmailsAndNames,
        title: nftPrivilege.title,
        emailBody: nftPrivilege.emailBody,
      });
      const uuid = this.generatorService.getRandomString(10);
      const params = SqsService.generatePayloadMessageAttribute(
        WebhookEvent.executePrivilege,
        payload,
      );

      await this.sqsService.sendQueue({
        MessageAttributes: params,
        MessageBody: `execute nft privilege. userId: ${userId} nftPrivilegeId: ${nftPrivilegeId}.`,
        QueueUrl: sqsWebhookStripeQueueUrl,
        MessageGroupId: `execute_nft_privilege_${uuid}`,
        MessageDeduplicationId: uuid,
      });

      return {
        result: Result.ok,
      };
    } catch (error) {
      const { message } = <Error>error;
      console.error(`cannot execute nft privilege ${message}`);

      return {
        result: Result.ng,
        message,
      };
    }
  }

  async getUserIssueNftPrivileges(
    userId: number,
    pagintOptions?: PagingOptionsInput,
  ): Promise<NFTPrivilege[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagintOptions);

    return await this.nFTPrivilegeRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        nftCampaign: {
          userId,
        },
      },
      include: {
        nftPrivilegeOnUsers: true,
      },
    });
  }

  async getExecutedNftPrivilegesByUserId(userId: number): Promise<NFTPrivilege[]> {
    return await this.nFTPrivilegeRepository.findMany({
      where: {
        nftPrivilegeOnUsers: {
          some: {
            userId,
          },
        },
      },
      include: {
        nftCampaign: {
          include: {
            user: true,
          },
        },
        nftPrivilegeOnUsers: true,
        nfts: {
          include: {
            nft: true,
          },
        },
      },
    });
  }

  async getExcecutableNftPrivilege(
    user: User,
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<Array<NFTPrivilege & { isExecutable: boolean }>> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const userHasNfts = await this.userHasNftRepository.findMany({
      where: {
        userId,
      },
      select: {
        nftId: true,
        amount: true,
      },
    });

    const nftPrivileges = await this.nFTPrivilegeRepository.findMany({
      ...pagingOptionsQuery,
      where: {
        nfts: {
          some: {
            nftId: { in: userHasNfts.map((userHasNft) => userHasNft.nftId) },
          },
        },
        expired: {
          gte: dayjs().toDate(),
        },
      },
      include: {
        nftCampaign: {
          include: {
            user: true,
          },
        },
        nftPrivilegeOnUsers: true,
        nfts: {
          include: {
            nft: true,
          },
        },
      },
      orderBy: {
        expired: 'asc',
      },
    });

    const result = nftPrivileges
      .map((nftPrivilege) => this.addAmountAndShippedToNftPrivilege(nftPrivilege, userHasNfts))
      .map((nftPrivilege) => {
        const isExecutable = this.checkExecutable(user, userId, nftPrivilege, userHasNfts);

        return {
          ...nftPrivilege,
          isExecutable,
        };
      });

    return await Promise.all(result);
  }

  private checkExecutable = (
    user: User,
    userId: number,
    nftPrivilege: NFTPrivilege,
    userHasNfts: UserHasNFT[],
  ): boolean => {
    const hasAllPrivilegeNfts = this.checkPrivilegeNftSize(nftPrivilege, userHasNfts);
    if (!hasAllPrivilegeNfts) return false;
    const userHasPrivilegeNfts = this.addAmountAndShippedRequiredToUserHasNFT(
      nftPrivilege,
      userHasNfts,
    );
    const userHasAllEnoughNFTs = this.checkNftPrivilegeAmount(userHasPrivilegeNfts);
    if (!userHasAllEnoughNFTs) return false;

    if (this.isBlockUser(user, nftPrivilege)) return false;

    const userNotYetLimitExecution = this.checkNftPrivilegeExecutionTimes(nftPrivilege);

    return userNotYetLimitExecution;
  };

  private addAmountAndShippedToNftPrivilege(
    nftPrivilege: NFTPrivilege,
    userHasNfts: UserHasNFT[],
  ): NFTPrivilege & {
    nfts: Array<NFTPrivilegeOnNFTs & { nft: NFT & { amount: number; shipped: number } }>;
  } {
    return {
      ...nftPrivilege,
      nfts: (nftPrivilege.nfts as NFTPrivilegeOnNFTs[]).map((nftPrivilegeOnNft) => {
        const finded = userHasNfts.find(({ nftId }) => nftId === nftPrivilegeOnNft.nftId);

        return {
          ...nftPrivilegeOnNft,
          nft: {
            ...nftPrivilegeOnNft.nft,
            amount: finded?.amount ?? 0,
            shipped: finded?.shipped ?? 0,
          },
        };
      }),
    };
  }

  private addAmountAndShippedRequiredToUserHasNFT(
    nftPrivilege: NFTPrivilege,
    userHasNfts: UserHasNFT[],
  ): Array<UserHasNFT & { required: number }> {
    return userHasNfts.map((nft) => {
      const finded = nftPrivilege.nfts?.find((nft) => nft.nftId);

      return {
        ...nft,
        required: finded?.required ?? 0,
      };
    });
  }

  private isBlockUser(user: User, nftPrivilege: NFTPrivilege): boolean {
    const blockedByIds = user.blockedBy?.map(extractIds) ?? [];

    return blockedByIds.indexOf(nftPrivilege.nftCampaign?.userId as number) !== -1;
  }

  private checkPrivilegeNftSize(nftPrivilege: NFTPrivilege, userHasNfts: UserHasNFT[]): boolean {
    const setNftPrivilege = new Set(nftPrivilege.nfts?.map((nft) => nft.nftId));
    const setUserHasNft = new Set(userHasNfts.map((userHasNft) => userHasNft.nftId));

    return (
      setNftPrivilege.size === setUserHasNft.size &&
      [...setNftPrivilege].every((value) => setUserHasNft.has(value))
    );
  }

  private checkNftPrivilegeAmount(userHasNfts: Array<UserHasNFT & { required: number }>): boolean {
    return userHasNfts.every(({ amount, required }) => required <= amount);
  }

  private checkNftPrivilegeExecutionTimes({
    id,
    limitExecutionTimes,
    nftPrivilegeOnUsers,
  }: NFTPrivilege): boolean {
    // 上限が0回で誰も実行できないとき
    if (!nftPrivilegeOnUsers) return false;
    const totalExecutionTimes = nftPrivilegeOnUsers.reduce(
      (prevTotalExecTimes, { nftPrivilegeId, executionTimes }) =>
        id === nftPrivilegeId ? prevTotalExecTimes + executionTimes : prevTotalExecTimes,
      0,
    );

    return limitExecutionTimes > totalExecutionTimes;
  }

  private async executeNFTPrivilege(
    userId: number,
    nftPrivilegeId: number,
    userHasNfts: Array<UserHasNFT & { required: number }>,
  ): Promise<void> {
    const mapped = userHasNfts.map((userHasNft) => ({
      ...userHasNft,
      amount: userHasNft.amount - userHasNft.required,
    }));
    const promises = mapped.map((userHasNft) => {
      return this.userHasNftRepository.update({
        where: {
          id: userHasNft.id,
        },
        data: {
          amount: userHasNft.amount,
        },
      });
    });
    await Promise.all(promises);

    await this.nFTPrivilegeOnUsersRepository.createOrUpdate({
      findArgs: {
        where: {
          userId,
          nftPrivilegeId,
        },
      },
      createArgs: {
        data: {
          userId,
          nftPrivilegeId,
          executionTimes: 1,
        },
      },
      updateInput: {
        executionTimes: {
          increment: 1,
        },
      },
    });
  }

  private getUserEmailsAndNames(
    user: User,
    nftPrivilege: NFTPrivilege,
  ): { userName: string; userEmail: string; ownerEmail: string; ownerName: string } {
    const userEmail = user.userPrivate?.email;
    if (!userEmail) {
      throw new Error('you must set email before getting executing nft privilege');
    }

    const ownerEmail = nftPrivilege.nftCampaign?.user?.userPrivate?.email;
    if (!ownerEmail) {
      throw new Error('owner must set email. you can contact support center');
    }

    return {
      userName: user.name,
      userEmail,
      ownerName: nftPrivilege.nftCampaign?.user?.name as string,
      ownerEmail,
    };
  }
}
