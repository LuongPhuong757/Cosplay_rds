import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'CureCosNFT配布イベント' })
export class OnDistributeInput {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'DistributeNFTのトランザクションハッシュ' })
  txHash: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'イベント発行元のCureCosNFTのコントラクトアドレス' })
  contractAddress: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'COTを受け取ったレイヤーのアドレス' })
  tipTarget: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'トークンID' })
  tokenId: string;
}
