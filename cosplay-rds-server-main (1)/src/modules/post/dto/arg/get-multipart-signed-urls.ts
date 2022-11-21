import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Field, ArgsType, Int } from 'type-graphql';

@ArgsType()
export class GetMultipartSignedUrlsArg {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'ファイルのContentType' })
  contentType: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Field((type) => Int, { description: '必要なmultipartアップロード用のUrl数' })
  partNumbers: number;
}
