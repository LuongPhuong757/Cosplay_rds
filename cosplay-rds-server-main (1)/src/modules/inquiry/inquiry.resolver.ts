import { ResultResponse } from '@common/response/result.response';
import { Arg, Mutation } from 'type-graphql';
import { Service } from 'typedi';
import { InquiryInput } from './dto/input/inquiry';
import { InquiryService } from './inquiry.service';

@Service()
export class InquiryResolver {
  constructor(private readonly inquiryService: InquiryService) {}

  @Mutation((returns) => ResultResponse, { description: 'メールアドレスを更新する。' })
  async inquiry(
    @Arg('input', (type) => InquiryInput) input: InquiryInput,
  ): Promise<ResultResponse> {
    return await this.inquiryService.sendmailInquiry(input);
  }
}
