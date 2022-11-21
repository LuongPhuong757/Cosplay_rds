import { registerEnumType } from 'type-graphql';

export enum CommentAble {
  DENY = 0,
  ALLOW = 1,
}

registerEnumType(CommentAble, {
  name: 'CommentAble',
  description: 'The type of CommentAble.',
});
