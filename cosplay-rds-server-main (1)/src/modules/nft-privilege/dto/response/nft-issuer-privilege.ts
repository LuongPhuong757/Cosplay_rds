import { NFTPrivilegeOnUsers } from '@modules/nft-privilege-on-user/nft-privilege-on-user.model';
import { Field, ObjectType, Int, Root } from 'type-graphql';
import { NFTPrivilege } from '../../nft-privilege.model';
import { INFTPriviledgeResponse } from './i-nft-privilege';

@ObjectType({ description: 'ユーザが発行しているNFTの特典情報の返却スキーマ' })
export class NFTIssuerPrivilegeResponse extends INFTPriviledgeResponse {
  @Field((type) => Int, {
    description: '特典の合計行使人数',
  })
  totalPersonCount(
    @Root() nftPrivilege: NFTPrivilege & { nftPrivilegeOnUsers: NFTPrivilegeOnUsers[] },
  ): number {
    return nftPrivilege.nftPrivilegeOnUsers.length;
  }

  @Field((type) => Int, {
    description: '特典の合計実行回数',
  })
  totalExecutionTimes(
    @Root() nftPrivilege: NFTPrivilege & { nftPrivilegeOnUsers: NFTPrivilegeOnUsers[] },
  ): number {
    return nftPrivilege.nftPrivilegeOnUsers.reduce(
      (accumulator: number, currentValue: NFTPrivilegeOnUsers) =>
        accumulator + currentValue.executionTimes ?? 0,
      0,
    );
  }
}
