import { GraphQLResolveInfo } from 'graphql';
import { ResolverData } from 'type-graphql';
import { PostGuard } from '../../src/guards/post.guard';
import { Post } from '../../src/modules/post/post.model';
import { User } from '../../src/modules/user/user.model';
import { prisma } from '../prisma-instance';

describe('PostGuard', () => {
  let user: User;
  let post: Post;

  const setup = () => {
    const mockedFunctions = {
      mockNext: jest.fn().mockReturnValue(true),
    };

    return mockedFunctions;
  };

  const createMockReolverData = () => {
    const context = { currentUser: user, prisma };
    const info = {} as GraphQLResolveInfo;
    const input = {
      postId: post.id,
    };

    return {
      context,
      root: {},
      args: { input },
      info,
    } as ResolverData;
  };

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        auth0Id: 'pg1-auth0Id',
        name: 'pg1-name',
        account: 'pg1-account',
        icon: 'pg1-icon',
        isBan: false,
        isCosplayer: false,
      },
    });
    post = await prisma.post.create({
      data: {
        userId: user.id,
      },
    });
  });

  it('call next().', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    await PostGuard(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
  });

  it('you cannot access the data.', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    const otherUserPostId = { postId: 10000 };
    mockResolverData.args.input = otherUserPostId;

    await expect(PostGuard(mockResolverData, mockNext)).rejects.toThrow(
      'you cannot access the data.',
    );
  });
});
