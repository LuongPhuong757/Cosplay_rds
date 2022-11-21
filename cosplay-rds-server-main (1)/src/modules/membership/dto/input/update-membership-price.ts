import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';
import { InputType, Field, Int } from 'type-graphql';

@InputType({ description: 'メンバーシップ料金の更新を行う。' })
export class UpdateMembershipPriceInput {
  @IsNotEmpty()
  @IsInt()
  @Field((type) => Int, { description: '価格' })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  @Field((type) => String, {
    description:
      '決済通貨。国際規格に準拠 + 小文字します。参照: https://github.com/stripe/stripe-go/blob/master/currency.go',
  })
  currency: string;
}
