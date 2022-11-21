import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { HashTagInterceptor } from '@interceptors/hash-tag.interceptor';
import { Resolver, Query, Arg, UseMiddleware, FieldResolver, Root, Int } from 'type-graphql';
import { Service } from 'typedi';
import { HashTagResponse } from './dto/response/hash-tag';
import { HashTag } from './hash-tag.model';
import { HashTagService } from './hash-tag.service';

@Service()
@Resolver((of) => HashTagResponse)
export class HashTagResolver {
  constructor(private readonly hashTagService: HashTagService) {}

  @Query((returns) => [HashTagResponse], { description: 'ハッシュタグを検索する。' })
  @UseMiddleware(HashTagInterceptor)
  async hashTags(
    @Arg('query', (type) => String) query: string,
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
  ): Promise<HashTag[]> {
    return await this.hashTagService.hashTags(query, pagingOptions);
  }

  @Query((returns) => [HashTagResponse], { description: 'ハッシュタグを検索する。' })
  @UseMiddleware(HashTagInterceptor)
  async hashTagsTrending(
    @Arg('pagingOptions', { nullable: true }) pagingOptions?: PagingOptionsInput,
  ): Promise<HashTag[]> {
    return await this.hashTagService.hashTagsTrending(pagingOptions);
  }

  @Query((returns) => HashTagResponse, { description: 'ハッシュタグ情報をIdから取得する。' })
  async hashTagById(@Arg('hashTagId', (type) => Int) hashTagId: number): Promise<HashTag> {
    return await this.hashTagService.findById(hashTagId);
  }

  @FieldResolver({ description: 'ハッシュタグに紐付く投稿画像・動画の総数を表すFieldResolver' })
  totalPosts(
    @Root() hashTag: HashTag & { _count: { [key: string]: number }; totalPosts: number },
  ): number {
    if (hashTag.totalPosts) {
      return hashTag.totalPosts;
    }

    return hashTag._count.posts;
  }
}
