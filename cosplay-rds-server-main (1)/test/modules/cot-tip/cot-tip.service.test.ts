import 'reflect-metadata';
import {
  COTTipNFTDistributionState,
  OnDistributeResult,
  OnTipResult,
} from '@modules/cot-tip/cot-tip.model';
import { COTTipRepository } from '@modules/cot-tip/cot-tip.repository';
import { COTTipService } from '@modules/cot-tip/cot-tip.service';
import { DisclosureRange } from '@modules/post/enum/disclosure-range';
import { User } from '@modules/user/user.model';
import { SqsService } from '@providers/sqs.provider';
import { prisma } from '../../prisma-instance';
import { userRepository } from '../../service-instance';

describe('COTTipService', () => {
  const cotTipRepository = new COTTipRepository(prisma);
  const sqsService = new SqsService();
  const cotTipService = new COTTipService(cotTipRepository, userRepository, sqsService);
  let newNFTDistributionState: COTTipNFTDistributionState;
  let postUser, postUser2: User;

  const setup = () => {
    const mockedFunctions = {
      sendQueue: jest.fn().mockResolvedValue(null),
    };

    sqsService.sendQueue = mockedFunctions.sendQueue;

    return mockedFunctions;
  };

  // アドレスはローカルネットワークのもの
  beforeAll(async () => {
    postUser = await prisma.user.create({
      data: {
        name: 'cot-tip-name',
        account: 'cot-tip-account',
        auth0Id: 'cot-tip-auth0Id',
        userPrivate: {
          create: {
            email: 'cot-tip@example.com',
            publicAddress: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
    postUser2 = await prisma.user.create({
      data: {
        name: 'cot-tip-name2',
        account: 'cot-tip-account2',
        auth0Id: 'cot-tip-auth0Id2',
        userPrivate: {
          create: {
            email: 'cot-tip2@example.com',
            publicAddress: '0x1B38Da6a701c568545dCfcB03FcB875f56beddC4'.toLowerCase(),
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'cot-tip-name-sender',
        account: 'cot-tip-account-sender',
        auth0Id: 'cot-tip-auth0Id-sender',
        userPrivate: {
          create: {
            email: 'cot-tip-sender@example.com',
            publicAddress: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
    await prisma.user.create({
      data: {
        name: 'cot-tip-name-dummy',
        account: 'cot-tip-account-dummy',
        auth0Id: 'cot-tip-auth0Id-dummy',
        userPrivate: {
          create: {
            email: 'cot-tip-dummy@example.com',
            publicAddress: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC0',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
    const nonRegStateUser = await prisma.user.create({
      data: {
        name: 'cot-tip-name-dummy2',
        account: 'cot-tip-account-dummy2',
        auth0Id: 'cot-tip-auth0Id-dummy2',
        userPrivate: {
          create: {
            email: 'cot-tip-dummy2@example.com',
            publicAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });
    const mShipOnlyUser = await prisma.user.create({
      data: {
        name: 'cot-tip-name-dummy3',
        account: 'cot-tip-account-dummy3',
        auth0Id: 'cot-tip-auth0Id-dummy3',
        userPrivate: {
          create: {
            email: 'cot-tip-dummy3@example.com',
            publicAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02dc',
          },
        },
      },
      include: {
        userPrivate: true,
      },
    });

    newNFTDistributionState = await prisma.cOTTipNFTDistributionState.create({
      data: {
        targetCosplayer: postUser.userPrivate!.publicAddress!,
        targetERC721: '0x0',
        lowerCOT: '100',
        userId: postUser.id,
      },
    });
    await prisma.cOTTipNFTDistributionState.create({
      data: {
        targetCosplayer: postUser2.userPrivate!.publicAddress!,
        targetERC721: '0x100',
        lowerCOT: '30',
        userId: postUser2.id,
      },
    });

    await prisma.post.create({
      data: {
        userId: postUser.id,
        caption: 'hoge fuga',
        disclosureRange: DisclosureRange.ALL,
        photos: {
          create: {
            image: 'testImage',
          },
        },
      },
      include: {
        photos: true,
      },
    });
    await prisma.post.create({
      data: {
        userId: postUser2.id,
        caption: 'foo bar',
        disclosureRange: DisclosureRange.ALL,
        photos: {
          create: {
            image: 'trialImage',
          },
        },
      },
      include: {
        photos: true,
      },
    });
    await prisma.post.create({
      data: {
        userId: nonRegStateUser.id,
        caption: 'hoge fuga piyo',
        disclosureRange: DisclosureRange.ALL,
        photos: {
          create: {
            image: 'testImage2',
          },
        },
      },
      include: {
        photos: true,
      },
    });
    await prisma.post.create({
      data: {
        userId: mShipOnlyUser.id,
        caption: 'foo bar baz',
        disclosureRange: DisclosureRange.MEMBERSHIP,
        photos: {
          create: {
            image: 'testImage3',
          },
        },
      },
      include: {
        photos: true,
      },
    });
  });

  describe('getCOTTipNFTDistributionState', () => {
    it('get registered state', async () => {
      const result = await cotTipRepository.findNFTDistributionState({
        where: {
          targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        },
      });

      expect(result?.targetCosplayer).toBe(newNFTDistributionState.targetCosplayer);
      expect(result?.targetERC721).toBe(newNFTDistributionState.targetERC721);
      expect(result?.lowerCOT).toBe(newNFTDistributionState.lowerCOT);
    });

    it('not registered state', async () => {
      const result = await cotTipRepository.findNFTDistributionState({
        where: {
          targetCosplayer: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        },
      });

      expect(result).toBe(null);
    });
  });

  describe('onTip', () => {
    it('tip 100 COT to registered cosplayer -> OK', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x1',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);

      expect(result.result).toBe(OnTipResult.OK);
      expect(sendQueue).toBeCalled();
      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(true);
    });

    it('tip 100 COT to registered cosplayer (txHash is already triggered) -> TX_HASH_ALREADY_TRIGGERED', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x1',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.TX_HASH_ALREADY_TRIGGERED);
      expect(sendQueue).not.toHaveBeenCalled();
    });

    it('tip 90 COT to registered cosplayer -> INSUFFICIENT_COT', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x2',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        cotAmount: '90',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.INSUFFICIENT_COT);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });

    it('tip 99.999999 COT to registered cosplayer -> INSUFFICIENT_COT', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x3',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        cotAmount: '99.999999',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.INSUFFICIENT_COT);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });

    it('tip 100 COT to non-registered cosplayer -> TARGET_COSPLAER_NOT_REGISTERED', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x4',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
        targetCosplayer: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.TARGET_COSPLAYER_NOT_REGISTERED);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });

    it('self tipping -> SELF_TIPPING_FORBIDDEN', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x5',
        tipFrom: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.SELF_TIPPING_FORBIDDEN);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });

    it('Target Cosplayer has no post -> TARGET_COSPLAYER_HAS_NO_POST', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x7',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb0',
        targetCosplayer: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC0',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.TARGET_COSPLAYER_HAS_NO_POST);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });

    it('Target Cosplayer has no public post -> TARGET_COSPLAYER_HAS_NO_POST', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x8',
        tipFrom: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb0',
        targetCosplayer: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02dc',
        cotAmount: '100',
      };
      const result = await cotTipService.onTip(input);
      expect(result.result).toBe(OnTipResult.TARGET_COSPLAYER_HAS_NO_POST);
      expect(sendQueue).not.toHaveBeenCalled();

      const existTxHash = await cotTipRepository.findTxHash({
        where: {
          txHash: input.txHash,
        },
      });
      expect(existTxHash).not.toBeNull();
      expect(existTxHash?.txHash).toBe(input.txHash);
      expect(existTxHash?.nftDistributed).toBe(false);
    });
  });

  describe('onDistribute', () => {
    it('valid distributed nft event -> OK', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x1',
        contractAddress: '0x0',
        tipTarget: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        tokenId: '1',
      };
      const result = await cotTipService.onDistribute(input);
      expect(result.result).toBe(OnDistributeResult.OK);
      expect(sendQueue).toHaveBeenCalled();
    });

    it('valid distributed nft event (txHash is already triggered) -> TX_HASH_ALREADY_TRIGGERED', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x1',
        contractAddress: '0x0',
        tipTarget: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        tokenId: '1',
      };
      const result = await cotTipService.onDistribute(input);
      expect(result.result).toBe(OnDistributeResult.TX_HASH_ALREADY_TRIGGERED);
      expect(sendQueue).not.toHaveBeenCalled();
    });

    it('tip target not registered', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x2',
        contractAddress: '0x0',
        tipTarget: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
        tokenId: '2',
      };
      const distributePromise = cotTipService.onDistribute(input);
      await expect(distributePromise).rejects.toThrow();
      expect(sendQueue).not.toHaveBeenCalled();
    });

    it('contract address mismatch', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x3',
        contractAddress: '0x1',
        tipTarget: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
        tokenId: '3',
      };
      const distributePromise = cotTipService.onDistribute(input);
      await expect(distributePromise).rejects.toThrow();
      expect(sendQueue).not.toHaveBeenCalled();
    });

    it('insensitive case in eth address', async () => {
      const { sendQueue } = setup();
      const input = {
        txHash: '0x4',
        contractAddress: '0x100',
        tipTarget: '0x1B38Da6a701c568545dCfcB03FcB875f56beddC4',
        tokenId: '3',
      };
      const result = await cotTipService.onDistribute(input);
      expect(result.result).toBe(OnDistributeResult.OK);
      expect(sendQueue).toHaveBeenCalled();
    });
  });
});
