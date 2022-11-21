import * as IUniswapV2PairJsonInterface from '@configs/abi/IUniswapV2Pair';
import configs from '@configs/index';
import { ethers } from 'ethers';
import { Service } from 'typedi';

const ethersConfig = configs.eth.matic;

@Service()
export class MaticProvider {
  readonly provider: ethers.providers.JsonRpcProvider;
  readonly lpcot: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(ethersConfig.jsonRpcUrl);
    this.lpcot = new ethers.Contract(
      ethersConfig.lpcot,
      IUniswapV2PairJsonInterface.default,
      this.provider,
    );
  }
}
