import { registerEnumType } from 'type-graphql';

export enum RankingInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

registerEnumType(RankingInterval, {
  name: 'RankingInterval',
  description: 'The type of ranking interval.',
});
