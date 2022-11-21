import { registerEnumType } from 'type-graphql';

export enum DisclosureRange {
  MEMBERSHIP = 0,
  FOLLOWER = 1,
  ALL = 2,
}

registerEnumType(DisclosureRange, {
  name: 'DisclosureRange',
  description: 'The type of DisclosureRange.',
});
