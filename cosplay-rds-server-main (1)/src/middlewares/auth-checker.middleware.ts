import { CosplayContext } from '@interfaces';
import { AuthChecker } from 'type-graphql';

export const authChecker: AuthChecker<CosplayContext> = ({ context: { currentUser } }): boolean =>
  currentUser !== undefined;
