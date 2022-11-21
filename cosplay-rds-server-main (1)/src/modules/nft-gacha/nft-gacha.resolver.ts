import { GetCurrentUser } from '@decorators/current-user.decorator';
import { NftResponse } from '@modules/nft/dto/response/nft.response';
import { NFT } from '@modules/nft/nft.model';
import { User } from '@modules/user/user.model';
import { Resolver, Query, Arg, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { NFTGachaService } from './nft-gacha.service';

@Service()
@Resolver()
export class NftGachaResolver {
  constructor(private readonly nFTGachaService: NFTGachaService) {}

  @Query((returns) => [NftResponse], {
    description: '指定したスーパチャットの決済に紐づくNFTの抽選結果を返却する',
  })
  @Authorized()
  async getNftGacha(
    @GetCurrentUser() { id }: User,
    @Arg('paymentIntentId', (type) => String) paymentIntentId: string,
  ): Promise<NFT[]> {
    return await this.nFTGachaService.getNftGacha(id, paymentIntentId);
  }
}
