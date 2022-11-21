import { registerEnumType } from 'type-graphql';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NONE = 'NONE',
}

registerEnumType(Gender, {
  name: 'GENDER',
  description: 'The type of gender.',
});
