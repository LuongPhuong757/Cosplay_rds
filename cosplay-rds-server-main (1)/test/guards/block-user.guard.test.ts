import { GraphQLResolveInfo } from 'graphql';
import { ResolverData } from 'type-graphql';
import { BlockUserGuard } from '../../src/guards/block-user.guard';
import { User } from '../../src/modules/user/user.model';
import { createUser } from '../helper';
import { prisma } from '../prisma-instance';

describe('BlockUserGuard', () => {
  let firstUser: User;

  beforeAll(async () => {
    firstUser = await prisma.user.create({
      data: {
        auth0Id: 'block1_auth0Id',
        name: 'block1_name',
        account: 'block1_account',
        icon: 'block1_icon',
        isBan: false,
        isCosplayer: false,
      },
    });
  });

  const setup = () => {
    const mockedFunctions = {
      mockNext: jest.fn().mockReturnValue(true),
    };

    return mockedFunctions;
  };

  const createMockReolverData = (isCurrentUser: User | undefined, userId: number) => {
    const context = {
      currentUser: isCurrentUser,
      prisma,
      session: '',
    };
    const info = {} as GraphQLResolveInfo;

    return {
      context,
      root: {},
      args: { userId },
      info,
    } as ResolverData;
  };

  const blockUser = async () => {
    const params = {
      auth0Id: 'block3_auth0Id',
      name: 'block3_name',
      account: 'block3_account',
      icon: 'block3_icon',
      isBan: false,
      isCosplayer: false,
    };
    const newUser = await createUser(params);
    await prisma.user.update({
      where: {
        id: newUser.id,
      },
      data: {
        blocking: {
          connect: {
            id: firstUser.id,
          },
        },
      },
    });

    return newUser;
  };

  it('call next().', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData(firstUser, 1000);
    await BlockUserGuard(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
  });

  it('currentUser is undefined.', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData(undefined, 1000);
    await BlockUserGuard(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
  });

  it('denided to access to the guarded resolver.', async () => {
    const { mockNext } = setup();
    const blockingUser = await blockUser();
    const firstCurrentUser = (await prisma.user.findUnique({
      where: { id: firstUser.id },
      include: { blockedBy: true },
    })) as User;
    const mockResolverData = createMockReolverData(firstCurrentUser, blockingUser.id);
    mockResolverData.args.userId = blockingUser.id;

    await expect(BlockUserGuard(mockResolverData, mockNext)).rejects.toThrow(
      'you have been blocked.',
    );
  });
});
