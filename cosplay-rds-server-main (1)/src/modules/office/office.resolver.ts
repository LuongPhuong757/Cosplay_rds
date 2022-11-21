import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Resolver, Query, Arg, Mutation, Authorized, Int } from 'type-graphql';
import { Service } from 'typedi';
import { OfficeResponse } from './dto/response/office';
import { Office } from './office.model';
import { OfficeService } from './office.service';

@Service()
@Resolver((of) => OfficeResponse)
export class OfficeResolver {
  constructor(private readonly officeService: OfficeService) {}

  @Query((returns) => OfficeResponse, {
    description: '事務所情報を返却する。',
  })
  @Authorized()
  async office(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Office> {
    return await this.officeService.getOffice(currentUser, pagingOptions);
  }

  @Mutation((returns) => Int, {
    description: '事務所がレイヤーの所属を解除する。事務所からのみ有効',
  })
  @Authorized()
  async restructure(
    @GetCurrentUser() currentUser: User,
    @Arg('layerId', (type) => Int) layerId: number,
  ): Promise<number> {
    return await this.officeService.restructureLayer(currentUser, layerId);
  }
}
