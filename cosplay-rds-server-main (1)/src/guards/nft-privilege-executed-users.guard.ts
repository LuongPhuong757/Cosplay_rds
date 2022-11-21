import { CosplayContext } from '@interfaces';
import { UserInputError, ForbiddenError } from 'apollo-server-express';
import { MiddlewareFn, NextFn, ResolverData } from 'type-graphql';

export const NftPrivilegeExecutedUsersGuard: MiddlewareFn = async (
  _: ResolverData,
  next: NextFn,
) => {
  const { prisma, currentUser } = _.context as CosplayContext;
  const { nftPrivilegeId } = _.args as { nftPrivilegeId: number };

  if (!currentUser) throw Error('you need to be logged in.');

  const nftPrivilege = await prisma.nFTPrivilege.findUnique({
    where: {
      id: nftPrivilegeId,
    },
    include: {
      nftCampaign: true,
    },
  });

  if (!nftPrivilege) {
    throw new UserInputError('Nft Privilege is not found.');
  }
  if (currentUser.id !== nftPrivilege.nftCampaign?.userId) {
    throw new ForbiddenError('you cannot access the data.');
  }

  return next();
};
