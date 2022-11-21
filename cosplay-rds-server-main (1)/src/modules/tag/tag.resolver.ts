import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { GetBlockUsers } from '@middlewares/get-block-users.middleware';
import { Event } from '@modules/event/event.model';
import { User } from '@modules/user/user.model';
import {
  Resolver,
  Query,
  Arg,
  Authorized,
  FieldResolver,
  Root,
  Int,
  UseMiddleware,
} from 'type-graphql';
import { Service } from 'typedi';
import { TagResponse } from './dto/response/tag';
import { TagSearchForPostResponse } from './dto/response/tag-search-for-post';
import { Tag } from './tag.model';
import { TagService } from './tag.service';

@Service()
@Resolver((of) => TagResponse)
export class TagResolver {
  constructor(private readonly tagService: TagService) {}

  @Query((returns) => [TagResponse], { description: 'タグ検索を行う。' })
  async tags(
    @Arg('query', (type) => String) query: string,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<Tag[]> {
    return await this.tagService.tags(query, pagingOptions);
  }

  @Query((returns) => TagResponse, { description: 'タグ検索を行う。' })
  async tag(@Arg('id', (type) => Int) id: number): Promise<Tag> {
    return await this.tagService.findTagById(id);
  }

  @Query((returns) => TagSearchForPostResponse, {
    description: '画像・動画投稿画面でのタグの検索を行う。',
  })
  @Authorized()
  @UseMiddleware(GetBlockUsers)
  async tagsSearchForPost(
    @GetCurrentUser() currentUser: User,
    @Arg('query', (type) => String) query: string,
    @Arg('pagingOptions', (type) => PagingOptionsInput, { nullable: true })
    pagingOptions?: PagingOptionsInput,
  ): Promise<{ users: User[]; events: Event[] }> {
    return await this.tagService.tagsSearchForPost(currentUser, query, pagingOptions);
  }

  @FieldResolver((returns) => Int, { description: '投稿画像・動画の総数を返却するFieldResolver' })
  totalPosts(@Root() tag: Tag & { _count: { [key: string]: number } }): number {
    return tag._count.posts;
  }
}
