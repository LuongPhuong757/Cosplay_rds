import { ResultResponse } from '@common/response/result.response';
import { XApiKeyGuard } from '@guards/x-api-key-guard';
import { Resolver, Arg, Mutation, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { DepositNftHistoryService } from './deposit-nft-history.service';
import { CreateDepositNftHistoryInput } from './dto/input/create-depoit-nft-history';

@Service()
@Resolver()
export class DepositNftHistoryResolver {
  constructor(private readonly depositNftHistoryService: DepositNftHistoryService) {}

  @Mutation((returns) => ResultResponse, {
    description: 'NFTの入庫処理を行う',
  })
  @UseMiddleware(XApiKeyGuard)
  async createDepositNFTHistory(
    @Arg('input', (type) => CreateDepositNftHistoryInput)
    input: CreateDepositNftHistoryInput,
  ): Promise<ResultResponse> {
    return await this.depositNftHistoryService.createDepositNFTHistory(input);
  }
}
