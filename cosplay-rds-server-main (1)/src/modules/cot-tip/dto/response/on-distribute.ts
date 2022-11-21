import { Field, ObjectType } from 'type-graphql';
import { OnDistributeResult } from '../../cot-tip.model';

@ObjectType({ description: 'OnDistributeの結果' })
export class OnDistributeResponse {
  @Field(() => OnDistributeResult, { description: 'OnDistributeの結果' })
  result: OnDistributeResult;

  @Field(() => String, { description: 'メッセージ' })
  message: string;
}
