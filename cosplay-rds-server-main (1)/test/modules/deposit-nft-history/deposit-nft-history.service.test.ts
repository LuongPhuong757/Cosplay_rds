import 'reflect-metadata';
import { Result } from '@common/response/result.enum';
import { DepositNftHistoryService } from '@modules/despoit-nft-history/deposit-nft-history.service';
import { User } from '@modules/user/user.model';
import { NFT } from '@prisma/client';
import { MaticProvider } from '@providers/matic.provider';
import { ethers } from 'ethers';
import { prisma } from '../../prisma-instance';
import {
  depositNftHistoryRepository,
  nftRepository,
  userHasNftRepository,
  userRepository,
} from '../../service-instance';

describe('DepositNnfHistoryService', () => {
  let depositUser: User;
  let depositToken: NFT;
  const maticProvider = new MaticProvider();
  const depositNftHistoryService = new DepositNftHistoryService(
    depositNftHistoryRepository,
    userHasNftRepository,
    userRepository,
    nftRepository,
    prisma,
    maticProvider,
  );

  const setup = (
    status: number,
    userId: number,
    contractAddress: string,
    tokenID: string,
    amount: number,
  ) => {
    const mockedFunctions = {
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: status,
        logs: [
          {
            topics: [
              '',
              ethers.utils.defaultAbiCoder.encode(['uint256'], [userId]),
              ethers.utils.defaultAbiCoder.encode(['address'], [contractAddress]),
              ethers.utils.defaultAbiCoder.encode(['uint256'], [tokenID]),
            ],
            data: ethers.utils.defaultAbiCoder.encode(['uint256'], [amount]),
          },
        ],
      }),
    };

    maticProvider.provider.getTransactionReceipt = mockedFunctions.getTransactionReceipt;

    return mockedFunctions;
  };

  beforeAll(async () => {
    depositUser = await prisma.user.create({
      data: {
        name: 'depo1-name',
        account: 'depo1-account',
        auth0Id: 'depo1-auth0Id',
        userPrivate: {
          create: {
            email: 'depo1@gmail.com',
            publicAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });

    depositToken = await prisma.nFT.create({
      data: {
        address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        totalSupply: 10000,
        name: 'depo1-token',
        image: 'depo1-image',
        description: 'depo1-token',
        rarity: 5,
      },
    });
  });

  describe('createDepositNFTHistory', () => {
    it('does not exist user', async () => {
      setup(1, depositUser.id + 999, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '999', 1);
      const input = {
        txHash: 'somethingHash',
        userId: depositUser.id + 999,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        amount: 1,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message?.includes('user does not exist')).toBe(true);
    });

    it('does not exist tokenID', async () => {
      setup(1, depositUser.id, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '77777', 1);
      const input = {
        txHash: 'somethingHash',
        userId: depositUser.id,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '77777',
        amount: 1,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message?.includes('nft does not exist')).toBe(true);
    });

    it('deposit nft', async () => {
      setup(1, depositUser.id, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '999', 10);
      const input = {
        txHash: 'somethingHash',
        userId: depositUser.id,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        amount: 10,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      const deposit = await prisma.userHasNFT.findFirst({
        where: {
          userId: depositUser.id,
          nftId: depositToken.id,
        },
      });

      expect(res.result).toBe(Result.ok);
      expect(res.message).toBe(undefined);
      expect(deposit?.amount).toBe(10);
    });

    it('already has txHash', async () => {
      await prisma.depositNFTHistory.create({
        data: {
          txHash: 'alredyTxHash',
        },
      });

      setup(1, depositUser.id, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '999', 1);
      const input = {
        txHash: 'alredyTxHash',
        userId: depositUser.id,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        amount: 1,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message?.includes('`this.depositNftHistoryRepository.create()`')).toBe(true);
    });

    it('event validation fail (transaction fail)', async () => {
      setup(0, depositUser.id, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '999', 10);
      const input = {
        txHash: 'alredyTxHash',
        userId: depositUser.id,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        amount: 10,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message?.includes('transaction is failed')).toBe(true);
    });

    it('event validation fail (invalid arguments)', async () => {
      setup(1, depositUser.id + 1, '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', '999', 10);
      const input = {
        txHash: 'alredyTxHash',
        userId: depositUser.id,
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        tokenID: '999',
        amount: 10,
      };
      const res = await depositNftHistoryService.createDepositNFTHistory(input);

      expect(res.result).toBe(Result.ng);
      expect(res.message?.includes('invalid arguments')).toBe(true);
    });
  });
});
