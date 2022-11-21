import { CotHistoryType } from '@modules/user-private/enum/cot-history-type';
import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { Field, ArgsType, Int } from 'type-graphql';

@ArgsType()
export class CotReceiveHistoryArg {
  @IsNotEmpty()
  @IsString()
  @Field((type) => CotHistoryType, { description: 'COTの投げ銭履歴の表示種別' })
  cotHistoryType: CotHistoryType;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Field((type) => Int, { description: 'fromDay日前からの履歴を指定する' })
  fromDay: number;
}
