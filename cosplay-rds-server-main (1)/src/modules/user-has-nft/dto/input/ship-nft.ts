import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'NFTを出庫する' })
export class ShipNFTInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '出庫対象のNFTのID' })
  nftId: number;

  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '出庫するNFTの数量' })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: '出庫先アドレス' })
  targetAddress: string;
}
