import { Result } from '@common/response/result.enum';
import { ResultResponse } from '@common/response/result.response';
import { NftRepository } from '@modules/nft/nft.repository';
import { UserHasNftRepository } from '@modules/user-has-nft/user-has-nft.repository';
import { UserRepository } from '@modules/user/user.repository';
import { MaticProvider } from '@providers/matic.provider';
import { PrismaService } from '@services/prisma.service';
import { ethers } from 'ethers';
import { Service } from 'typedi';
import { DepositNftHistoryRepository } from './deposit-nft-history.respository';
import { CreateDepositNftHistoryInput } from './dto/input/create-depoit-nft-history';

@Service()
export class DepositNftHistoryService {
  constructor(
    private readonly depositNftHistoryRepository: DepositNftHistoryRepository,
    private readonly userHasNftRepository: UserHasNftRepository,
    private readonly userRepository: UserRepository,
    private readonly nftRepository: NftRepository,
    private readonly prisma: PrismaService,
    private readonly maticProvider: MaticProvider,
  ) {}

  async createDepositNFTHistory(input: CreateDepositNftHistoryInput): Promise<ResultResponse> {
    const { txHash, userId, contractAddress, tokenID, amount } = input;

    try {
      await this.validateTx(input);

      const user = await this.userRepository.findOne({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new Error(`user does not exist userId: ${userId}`);
      }

      const nft = await this.nftRepository.findFirst({
        where: {
          address: {
            equals: contractAddress,
            mode: 'insensitive',
          },
          tokenID,
        },
      });
      if (!nft) {
        throw new Error(
          `nft does not exist contractAddress: ${contractAddress} tokenID: ${tokenID}`,
        );
      }

      await this.prisma.$transaction(
        async (): Promise<void> => {
          await this.depositNftHistoryRepository.create({
            data: {
              txHash,
            },
          });

          const args = {
            findArgs: {
              where: {
                userId: user.id,
                nftId: nft.id,
              },
            },
            createArgs: {
              data: {
                userId: user.id,
                nftId: nft.id,
                amount,
                shipped: 0,
              },
            },
            updateInput: {
              amount: {
                increment: amount,
              },
            },
          };

          await this.userHasNftRepository.createOrUpdate(args);
        },
      );

      return {
        result: Result.ok,
      };
    } catch (e) {
      const { message } = <Error>e;
      console.error(
        `fatal: cannot deposit nft. message: ${message} input: ${JSON.stringify(input)}.`,
      );

      return {
        result: Result.ng,
        message,
      };
    }
  }

  private async validateTx(input: CreateDepositNftHistoryInput): Promise<void> {
    const { txHash, userId, contractAddress, tokenID, amount } = input;

    const txReceipt = await this.maticProvider.provider.getTransactionReceipt(txHash);
    if (!txReceipt.status) {
      throw new Error(`transaction is failed (txHash: ${txHash})`);
    }

    const argsValid =
      txReceipt.logs.findIndex((log) => DepositNftHistoryService.argsMatch(input, log)) !== -1;
    if (!argsValid) {
      throw new Error(
        `invalid arguments (txHash: ${txHash}, userId: ${userId}, contractAddress: ${contractAddress}, tokenId: ${tokenID}, amount: ${amount})`,
      );
    }
  }

  private static argsMatch(
    input: CreateDepositNftHistoryInput,
    log: ethers.providers.Log,
  ): boolean {
    const { userId, contractAddress, tokenID, amount } = input;
    if (log.topics.length !== 4) {
      return false;
    }

    const inputParams = [
      ethers.utils.defaultAbiCoder.encode(['uint256'], [userId]),
      ethers.utils.defaultAbiCoder.encode(['address'], [contractAddress]),
      ethers.utils.defaultAbiCoder.encode(['uint256'], [tokenID]),
      ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]),
    ];
    // topicsの最初の要素はイベントの署名、以降は、indexedを付けたイベントのパラメーターが入る（それぞれABIエンコードされている）
    // dataはindexedを付けていないイベントのパラメーターをまとめてABIエンコードされたものが入る
    const logParams = [...log.topics.slice(1), log.data];
    for (let i = 0; i < inputParams.length; i++) {
      if (inputParams[i] !== logParams[i]) {
        return false;
      }
    }

    return true;
  }
}
