import { NFTPrivilegeOnUsers } from '@modules/nft-privilege-on-user/nft-privilege-on-user.model';
import { UserResponse } from '@modules/user/dto/response/user';
import { User } from '@modules/user/user.model';
import { Field, ObjectType, Int, Root } from 'type-graphql';
import { NFTPrivilege } from '../../nft-privilege.model';
import { PrivilegeHasNFTResponse } from './privilege-has-nft';

@ObjectType({ description: 'NFTの特典情報の返却スキーマ' })
export abstract class INFTPriviledgeResponse {
  @Field((type) => Int, { description: 'ID' })
  id: number;

  @Field((type) => String, { description: '特典のタイトル' })
  title: string;

  @Field((type) => String, { description: '特典の説明' })
  description: string;

  @Field((type) => Date, { description: '特典の期限' })
  expired: Date;

  @Field((type) => Int, { description: '特典の実行制限回数' })
  limitExecutionTimes: number;

  @Field((type) => [PrivilegeHasNFTResponse], { description: '特典に必要なNFT' })
  nfts: PrivilegeHasNFTResponse[];

  @Field((type) => UserResponse, {
    description: 'NFT特典の発行元のユーザを表す',
  })
  issuer(
    @Root() nftPrivilege: NFTPrivilege & { nftPrivilegeOnUsers: NFTPrivilegeOnUsers[] },
  ): User | null {
    return nftPrivilege.nftCampaign?.user ?? null;
  }
}
