import { registerEnumType } from 'type-graphql';

export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'The type of transacionType.',
});
