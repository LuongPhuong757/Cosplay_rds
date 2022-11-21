import { registerEnumType } from 'type-graphql';

export enum SettingValue {
  OFF,
  FOLLOW,
  ALL,
}

registerEnumType(SettingValue, {
  name: 'SettingValue',
  description: 'The type of value on setting.',
});
