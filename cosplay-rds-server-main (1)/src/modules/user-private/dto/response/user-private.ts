import { Field, ObjectType, Root } from 'type-graphql';
import { Gender } from '../../enum/gender';
import { UserPrivate } from '../../user-private.model';

@ObjectType({ description: 'ユーザのプライベート情報の返却スキーマ' })
export class UserPrivateResponse {
  @Field((type) => String, { nullable: true, description: 'メールアドレス' })
  email: string | null;

  @Field((type) => String, { nullable: true, description: '電場番号' })
  phone: string | null;

  @Field((type) => Date, { nullable: true, description: '誕生日' })
  birthday: Date | null;

  @Field((type) => Gender, { defaultValue: Gender.NONE, description: '性別' })
  gender: Gender;

  @Field((type) => String, {
    nullable: true,
    description: 'ストライプのカスタマーId、サブスクリプション処理に使用します。',
  })
  stripeCustomerId: string | null;

  @Field((type) => String, { nullable: true, description: 'BSC public address' })
  publicAddress: string | null;

  @Field((type) => Boolean, { nullable: true, description: 'メールが認証済みかどうかを示す' })
  isEmailVerified(@Root() { email, emailVerifyToken }: UserPrivate): boolean | null {
    if (!email && !emailVerifyToken) return null;

    return !emailVerifyToken;
  }

  @Field((type) => String, { nullable: true, description: '連携済みのtwitterAccount名' })
  twitterAccount: string | null;
}
