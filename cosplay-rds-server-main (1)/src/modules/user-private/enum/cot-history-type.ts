import { registerEnumType } from 'type-graphql';

export enum CotHistoryType {
  TRANSACTION = 'transaction',
  USER = 'user',
}

registerEnumType(CotHistoryType, {
  name: 'CotHistoryType',
  description: 'The type of cotHistory.',
});
