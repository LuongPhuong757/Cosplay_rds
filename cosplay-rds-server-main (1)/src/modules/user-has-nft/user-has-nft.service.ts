import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import config from '@config';
import { NftResponse } from '@modules/nft/dto/response/nft.response';
import { NFT } from '@modules/nft/nft.model';
import { SqsService } from '@providers/sqs.provider';
import { GeneratorService } from '@services/generator.service';
import { Service } from 'typedi';
import { ShipNFTInput } from './dto/input/ship-nft';
import { UserHasNFT } from './user-has-nft.model';
import { UserHasNftRepository } from './user-has-nft.repository';

const { shipmentNFTQueueUrl } = config.aws;

@Service()
export class UserHasNftService {
  constructor(
    private readonly userHasNftRepository: UserHasNftRepository,
    private readonly sqsService: SqsService,
    private readonly generatorService: GeneratorService,
  ) {}

  async findOwnedNFTs(
    userId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<Array<UserHasNFT & { nft: NFT & { amount: number; shipped: number } }>> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const args = {
      ...pagingOptionsQuery,
      where: {
        userId,
      },
      include: {
        nft: true,
      },
    };

    const userHasNfts = (await this.userHasNftRepository.findMany(args)) as Array<
      UserHasNFT & {
        nft: NftResponse;
      }
    >;

    return userHasNfts.map((userHasNft) => ({
      ...userHasNft,
      nft: { ...userHasNft.nft, amount: userHasNft.amount, shipped: userHasNft.shipped },
    }));
  }

  async getUserCampaignNfts(
    userId: number,
    campaignId: number,
    pagingOptions?: PagingOptionsInput,
  ): Promise<UserHasNFT[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const args = {
      ...pagingOptionsQuery,
      where: {
        userId,
        nft: {
          campaignId,
        },
      },
    };

    return await this.userHasNftRepository.findMany(args);
  }

  async shipNFT(
    userId: number,
    input: ShipNFTInput,
  ): Promise<UserHasNFT & { nft: NFT & { amount: number; shipped: number } }> {
    const { nftId, amount, targetAddress } = input;
    const userHasNft = await this.userHasNftRepository.findFirst({
      where: {
        userId,
        nftId,
      },
      include: {
        nft: true,
      },
    });
    if (!userHasNft) {
      throw new Error(`user does not have this nft. nftId ${nftId}`);
    }
    if (userHasNft.amount < amount) {
      throw new Error(`nft amount is not enough`);
    }

    const payload = JSON.stringify({
      to: targetAddress,
      contractAddress: userHasNft.nft?.address,
      tokenId: userHasNft.nft?.tokenID,
      amount,
    });
    const uuid = this.generatorService.getRandomString(10);
    const params = SqsService.generatePayloadMessageAttribute('shipment', payload);

    await this.sqsService.sendQueue({
      MessageAttributes: params,
      MessageBody: `execute nft shipment. userId: ${userId} nftId: ${nftId}.`,
      QueueUrl: shipmentNFTQueueUrl,
      MessageGroupId: `execute_nft_shipment_${uuid}`,
      MessageDeduplicationId: uuid,
    });

    const updated = await this.userHasNftRepository.update({
      where: {
        id: userHasNft.id,
      },
      data: {
        amount: {
          decrement: amount,
        },
        shipped: {
          increment: amount,
        },
      },
      include: {
        nft: true,
      },
    });

    return {
      ...updated,
      nft: { ...updated.nft, amount: updated.amount, shipped: updated.shipped } as NFT & {
        amount: number;
        shipped: number;
      },
    };
  }
}
