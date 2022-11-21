import { CacheContext } from '@interfaces';
import { TokenInfoListResponse } from '@modules/token-info/dto/response/token-info-list';
import { createParamDecorator } from 'type-graphql';

export const GetCache = (): ParameterDecorator =>
  createParamDecorator<CacheContext<TokenInfoListResponse>>(({ context }) => ({
    cacheData: context.cacheData,
    fieldName: context.fieldName,
  }));
