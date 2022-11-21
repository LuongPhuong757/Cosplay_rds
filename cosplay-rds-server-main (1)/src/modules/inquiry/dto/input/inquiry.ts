import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { InputType, Field } from 'type-graphql';

@InputType({ description: '{ nullable: true,' })
export class InquiryInput {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'お問い合わせ送信者名' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'お問い合わせ送信者名' })
  nameFurigana: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'お問い合わせ送信者名' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'お問い合わせ送信者名' })
  inquiryItem: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'お問い合わせ送信者名' })
  content: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'タイムホルダーのお問い合わせ' })
  time: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'IP送信者照会' })
  userIp: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'Agent送信者照会' })
  userAgent: string;

  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'Device送信者照会' })
  device: string;

  @IsString()
  @IsOptional()
  @Field((type) => String, { nullable: true, description: 'link送信者照会' })
  userUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Field((type) => String, { description: 'ユーザの言語情報 ISO 639-1 Code ex: ja, en' })
  lang: string;
}
