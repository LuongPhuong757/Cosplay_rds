import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'データ取得用オプション' })
export class CreateDepositNftHistoryInput {
  @IsInt()
  @IsNotEmpty()
  @Field((type) => Int, { description: '入庫するユーザのID' })
  userId: number;

  @IsString()
  @IsNotEmpty()
  @Field((type) => String, { description: '入庫するNFTのコントラクトアドレス' })
  contractAddress: string;

  @IsString()
  @IsNotEmpty()
  @Field((type) => String, { description: '入庫処理を行なったトランザクションHash' })
  txHash: string;

  @IsString()
  @IsNotEmpty()
  @Field((type) => String, { description: 'NFT TOKENのID' })
  tokenID: string;

  @IsInt()
  @IsNotEmpty()
  @Field((type) => Int, { description: 'トークン量' })
  amount: number;
}
