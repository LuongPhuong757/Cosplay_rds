import { getCurrentTime } from '@common/util/current-time';
import { PrismaService } from '@services/prisma.service';
import { Container } from 'typedi';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

// Set the ERC-20 balanceOf() ABI
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const balanceOfABI: AbiItem = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

// Define the ERC-20 token contract
class RankingCotJob {
  prismaService: PrismaService;

  constructor() {
    this.prismaService = Container.get(PrismaService);
  }

  async processJob(): Promise<void> {
    console.log(`start update total cot job. ${getCurrentTime()}`);

    try {
      const resultAll = await this.getPublicAdress();
      // eslint-disable-next-line @typescript-eslint/require-await
      resultAll.map(async (result) => {
        const balanceEth = await this.getBalanceEthereum(result.publicAddress);
        const balancePoly = await this.getBalancePolygon(result.publicAddress);
        const totalCot = balanceEth + balancePoly;
        if (totalCot != result.totalCot) {
          await this.prismaService.userPrivate.update({
            where: {
              id: result.id,
            },
            data: {
              totalCot: totalCot,
            },
          });
        }
      });
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`update total cot job cannot be processed. message: ${message}.`);
    }

    console.log(`finish update total cot job. ${getCurrentTime()}`);
  }

  async getPublicAdress() {
    return await this.prismaService.userPrivate.findMany({
      where: {
        NOT: [
          {
            publicAddress: null,
          },
        ],
      },
      select: {
        id: true,
        publicAddress: true,
        totalCot: true,
      },
    });
  }

  async getBalanceEthereum(tokenHolder: any): Promise<number> {
    const tokenContract = '0x5CAc718A3AE330d361e39244BF9e67AB17514CE8';
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        'https://nd-067-698-669.p2pify.com/6bb528a00adcae373ba8fba075b547b3',
      ),
    );
    const contract = new web3.eth.Contract(balanceOfABI, tokenContract);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const result = await contract.methods.balanceOf(tokenHolder).call(); // 29803630997051883414242659

    // Convert the value from Wei to Ether
    const formattedResult = web3.utils.fromWei(result, 'ether'); // 29803630.997051883414242659

    return parseFloat(formattedResult);
  }

  async getBalancePolygon(tokenHolder: any): Promise<number> {
    const tokenContract = '0x8d520c8E66091cfD6743fe37Fbe3A09505616C4b';
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        'https://nd-049-088-724.p2pify.com/a851d584b524a5bbcac8a7516142bf8d',
      ),
    );
    const contract = new web3.eth.Contract(balanceOfABI, tokenContract);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const result = await contract.methods.balanceOf(tokenHolder).call(); // 29803630997051883414242659

    // Convert the value from Wei to Ether
    const formattedResult = web3.utils.fromWei(result, 'ether'); // 29803630.997051883414242659

    return parseFloat(formattedResult);
  }
}

export const rankingCotJob = new RankingCotJob();
