import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: 'COTを投げ銭した時のイベント' })
export class OnTipInput {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'COT-Transferのトランザクションハッシュ' })
  txHash: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'COTを投げ銭したユーザーのアドレス' })
  tipFrom: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  @Field((type) => String, { description: 'COTを受け取ったレイヤーのアドレス' })
  targetCosplayer: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: '投げ銭したCOTの量' })
  cotAmount: string;
}
