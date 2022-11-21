import { GraphQLResolveInfo } from 'graphql';
import { ResolverData } from 'type-graphql';
import { HashTagInterceptor } from '../../src/interceptors/hash-tag.interceptor';

describe('HashTagInterceptor', () => {
  const setup = () => {
    const mockedFunctions = {
      mockNext: jest.fn().mockReturnValue(true),
    };

    return mockedFunctions;
  };

  const createMockReolverData = (args: { query: string }) => {
    const context = {};
    const info = {} as GraphQLResolveInfo;

    return {
      context,
      root: {},
      args,
      info,
    } as ResolverData;
  };

  it('call next().', async () => {
    const { mockNext } = setup();
    const args = {
      query: 'hello',
    };
    const mockResolverData = createMockReolverData(args);
    await HashTagInterceptor(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
    expect(args.query).toBe('hello');
  });

  it('remove hashtag from query.', async () => {
    const { mockNext } = setup();
    const args = {
      query: '#hello',
    };
    const mockResolverData = createMockReolverData(args);
    await HashTagInterceptor(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
    expect(args.query).toBe('hello');
  });

  it('throw error', async () => {
    const { mockNext } = setup();
    const args = {
      query: '#',
    };
    const mockResolverData = createMockReolverData(args);

    await expect(HashTagInterceptor(mockResolverData, mockNext)).rejects.toThrow(
      'you have to add other characters after "#".',
    );
    expect(mockNext).not.toBeCalled();
  });
});
