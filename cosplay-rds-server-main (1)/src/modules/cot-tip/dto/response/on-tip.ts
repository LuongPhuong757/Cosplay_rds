import { Field, ObjectType } from 'type-graphql';
import { OnTipResult } from '../../cot-tip.model';

@ObjectType({ description: 'OnTipの結果' })
export class OnTipResponse {
  @Field(() => OnTipResult, { description: 'OnTipの結果' })
  result: OnTipResult;

  @Field(() => String, { description: 'メッセージ' })
  message: string;
}
