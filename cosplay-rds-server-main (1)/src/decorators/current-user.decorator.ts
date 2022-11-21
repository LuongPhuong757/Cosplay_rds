import { Context } from '@interfaces';
import { createParamDecorator } from 'type-graphql';

export const GetCurrentUser = (): ParameterDecorator =>
  createParamDecorator<Context>(({ context }) => context.currentUser);
