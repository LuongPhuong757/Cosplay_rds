import { XApiKeyGuard } from '@guards/x-api-key-guard';
import { COTTipService } from '@modules/cot-tip/cot-tip.service';
import { OnDistributeInput } from '@modules/cot-tip/dto/input/on-distribute';
import { OnTipInput } from '@modules/cot-tip/dto/input/on-tip';
import { OnDistributeResponse } from '@modules/cot-tip/dto/response/on-distribute';
import { OnTipResponse } from '@modules/cot-tip/dto/response/on-tip';
import { Arg, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';

@Service()
@Resolver(() => OnTipResponse)
export class COTTipResolver {
  constructor(private readonly cotTipService: COTTipService) {}

  @Mutation(() => OnTipResponse, { description: 'COT投げ銭によるNFT配布イベント処理' })
  @UseMiddleware(XApiKeyGuard)
  async onTip(@Arg('input', () => OnTipInput) input: OnTipInput): Promise<OnTipResponse> {
    return await this.cotTipService.onTip(input);
  }

  @Mutation(() => OnDistributeResponse, { description: 'COT投げ銭によるNFT配布後イベント処理' })
  @UseMiddleware(XApiKeyGuard)
  async onDistribute(
    @Arg('input', () => OnDistributeInput) input: OnDistributeInput,
  ): Promise<OnDistributeResponse> {
    return await this.cotTipService.onDistribute(input);
  }
}
