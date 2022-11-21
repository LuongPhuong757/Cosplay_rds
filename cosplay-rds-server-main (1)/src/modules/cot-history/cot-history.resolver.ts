import { GetCurrentUser } from '@decorators/current-user.decorator';
import { User } from '@modules/user/user.model';
import { Resolver, Query, Authorized } from 'type-graphql';
import { Service } from 'typedi';
import { CotHistoryService } from './cot-history.service';
import { MonthlyCotResponse } from './dto/response/montly-cot';
import { MonthlyCot } from './interface/monthly-cot';

@Service()
@Resolver()
export class CotHistoryResolver {
  constructor(private readonly cotHistoryService: CotHistoryService) {}

  @Query((returns) => [MonthlyCotResponse], { description: '月ごとのCotを取得する' })
  @Authorized()
  async getMonthlyCots(@GetCurrentUser() { id }: User): Promise<MonthlyCot[]> {
    return await this.cotHistoryService.getMonthlyCots(id);
  }
}
