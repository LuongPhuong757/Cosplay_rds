import { IsNotEmpty, IsString } from 'class-validator';
import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class GetImageSignedUrlArg {
  @IsNotEmpty()
  @IsString()
  @Field((type) => String, { description: 'ファイルのContentType' })
  contentType: string;
}
