import { Context } from '@interfaces';
import { createParamDecorator } from 'type-graphql';

export const GetAuth0Id = (): ParameterDecorator =>
  createParamDecorator<Context>(({ context }) => context.auth0Id);
