import { IsInt, IsNotEmpty } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'NFT特典を行使するためのスキーマ' })
export class ExecutePrivilegeInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: 'NFT特典のID' })
  nftPrivilegeId: number;
}
