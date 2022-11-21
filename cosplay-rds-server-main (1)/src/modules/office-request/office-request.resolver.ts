import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Resolver, Query, Arg, Mutation, Authorized, Int } from 'type-graphql';
import { Service } from 'typedi';
import { OfficeRequestResponse } from './dto/response/office-request';
import { OfficeRequest } from './office-request.model';
import { OfficeRequestService } from './office-request.service';

@Service()
@Resolver((of) => OfficeRequestResponse)
export class OfficeRequestResolver {
  constructor(private readonly officeRequestService: OfficeRequestService) {}

  @Query((returns) => [OfficeRequestResponse], {
    description: 'コスプレイヤーが、事務所からのリクエスト一覧を取得する。',
  })
  @Authorized()
  async getEmploymentRequest(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<OfficeRequest[]> {
    return await this.officeRequestService.getOfficeRequests(currentUser, pagingOptions);
  }

  @Mutation((returns) => OfficeRequestResponse, {
    description: '事務所がリクエストをコスプレイヤーに送信する。',
  })
  @Authorized()
  async employmentRequest(
    @GetCurrentUser() currentUser: User,
    @Arg('layerId', (type) => Int) layerId: number,
  ): Promise<OfficeRequest> {
    return await this.officeRequestService.createOfficeRequest(currentUser, layerId);
  }

  @Mutation((returns) => Int, {
    description: '事務所からのリクエストを承認する。',
  })
  @Authorized()
  async approveEmploymentRequest(
    @GetCurrentUser() currentUser: User,
    @Arg('officeRequestId', (type) => Int) officeRequestId: number,
  ): Promise<number> {
    return await this.officeRequestService.approveOfficeRequest(currentUser, officeRequestId);
  }

  @Mutation((returns) => Int, {
    description: '事務所からのリクエストを拒否する。',
  })
  @Authorized()
  async rejectEmploymentRequest(
    @Arg('officeRequestId', (type) => Int) officeRequestId: number,
  ): Promise<number> {
    return await this.officeRequestService.rejectOfficeRequest(officeRequestId);
  }
}
