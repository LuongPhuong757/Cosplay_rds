import { registerEnumType } from 'type-graphql';

export enum OfficeRequestStatus {
  REQUESTING = 'REQUESTING',
  APPROVED = 'APPROVED',
  RESTRUCTURED = 'RESTRUCTURED',
}

registerEnumType(OfficeRequestStatus, {
  name: 'OfficeRequestStatus',
  description: 'The type of info',
});
