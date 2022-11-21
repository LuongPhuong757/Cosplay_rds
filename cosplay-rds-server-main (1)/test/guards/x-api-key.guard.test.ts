import 'reflect-metadata';
import { GraphQLResolveInfo } from 'graphql';
import { ResolverData } from 'type-graphql';
import config from '../../src/configs';
import { XApiKeyGuard } from '../../src/guards/x-api-key-guard';

const { xApiKey } = config.app;

describe('XApiKeyGuard', () => {
  const input = {
    auth0Id: 'creare_user_guard1_auth0Id',
    name: 'creare_user_guard1_name',
    email: 'creare_user_guard1_email@example.com',
    authHookSecret: 'testAuth0HookSecret',
  };

  const setup = () => {
    const mockedFunctions = {
      mockNext: jest.fn().mockReturnValue(true),
    };

    return mockedFunctions;
  };

  const createMockReolverData = () => {
    const context = {
      ctx: {
        req: {
          headers: {
            'x-api-key': xApiKey,
          },
        },
      },
    };
    const info = {} as GraphQLResolveInfo;

    return {
      context,
      root: {},
      args: { input },
      info,
    } as ResolverData;
  };

  it('call next().', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    await XApiKeyGuard(mockResolverData, mockNext);

    expect(mockNext).toBeCalled();
  });

  it('throw error.', async () => {
    const { mockNext } = setup();
    const mockResolverData = createMockReolverData();
    mockResolverData.context = {
      ctx: {
        req: {
          headers: {
            'x-api-key': 'wrongXApiKey',
          },
        },
      },
    };

    await expect(XApiKeyGuard(mockResolverData, mockNext)).rejects.toThrow('x-api-key is wrong.');
  });
});
