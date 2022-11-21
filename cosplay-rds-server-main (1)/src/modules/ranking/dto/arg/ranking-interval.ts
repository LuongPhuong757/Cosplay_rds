import { ArgsType, Field, registerEnumType } from 'type-graphql';
import { RankingInterval } from '../../enum/ranking-interval';

registerEnumType(RankingInterval, {
  name: 'RankingInterval',
  description: 'The type of info message',
});

@ArgsType()
export class RankingIntervalArg {
  @Field((type) => RankingInterval, { description: 'ランキング取得の指定期間' })
  interval: RankingInterval;
}
