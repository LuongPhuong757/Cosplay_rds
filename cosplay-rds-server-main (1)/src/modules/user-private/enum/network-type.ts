import { registerEnumType } from 'type-graphql';

export enum NetworkType {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
}

registerEnumType(NetworkType, {
  name: 'NetworkType',
  description: 'The type of networkType.',
});
