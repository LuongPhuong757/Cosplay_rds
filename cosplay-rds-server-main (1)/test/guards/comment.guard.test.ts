import { GraphQLResolveInfo } from 'graphql';
import { ResolverData } from 'type-graphql';
import { CommentGuard } from '../../src/guards/comment.guard';
import { Comment } from '../../src/modules/comment/comment.model';
import { User } from '../../src/modules/user/user.model';
import { prisma } from '../prisma-instance';

describe('CommentGuard', () => {
  let user: User;
  let comment: Comment;

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
      commentId: comment.id,
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
        auth0Id: 'cg1-auth0Id',
        name: 'cg1-name',
        account: 'cg1-account',
        icon: 'cg1-icon',
        isBan: false,
        isCosplayer: false,
      },
    });
    const post = await prisma.post.create({
      data: {
        userId: user.id,
      },
    });
    comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: user.id,
        comment: 'cg test comment',
      },
    });
  });

  it('call next().', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    await CommentGuard(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
  });

  it('you cannot access the data.', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    const otherUserCommentId = { commentId: 10000 };
    mockResolverData.args.input = otherUserCommentId;

    await expect(CommentGuard(mockResolverData, mockNext)).rejects.toThrow(
      'you cannot access the data.',
    );
  });
});
