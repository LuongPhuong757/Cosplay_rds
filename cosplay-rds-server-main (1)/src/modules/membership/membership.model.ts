import { Price } from '@modules/price/price.model';
import { Membership as PrismaMembership } from '@prisma/client';

export type Membership = {
  membershipPrice?: Price | null;
} & PrismaMembership;
