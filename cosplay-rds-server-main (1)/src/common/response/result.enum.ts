import { registerEnumType } from 'type-graphql';

export enum Result {
  ok = 'ok',
  ng = 'ng',
}

registerEnumType(Result, {
  name: 'Result',
  description: 'The type of Result.',
});
