import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { GetCurrentUser } from '@decorators/current-user.decorator';
import { CommentGuard } from '@guards/comment.guard';
import { User } from '@modules/user/user.model';
import {
  Resolver,
  Mutation,
  Arg,
  Authorized,
  Query,
  FieldResolver,
  Root,
  Int,
  UseMiddleware,
} from 'type-graphql';
import { Service } from 'typedi';
import { Comment } from './comment.model';
import { CommentService } from './comment.service';
import { CreateCommentInput, EditCommentInput } from './dto/input/create-comment';
import { DeleteCommentInput } from './dto/input/delete-comment';
import { ReplyCommentInput } from './dto/input/replay-comment';
import { CommentResponse } from './dto/response/comment';

@Service()
@Resolver((of) => CommentResponse)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @Query((returns) => [CommentResponse], { description: 'コメント一覧を取得する。' })
  async comments(
    @GetCurrentUser() currentUser: User,
    @Arg('pagingOptions', (type) => PagingOptionsInput) pagingOptions: PagingOptionsInput,
    @Arg('postId', (type) => Int) postId: number,
    @Arg('replyId', (type) => Int, { nullable: true }) replyId?: number,
  ): Promise<Comment[]> {
    return await this.commentService.comments(currentUser, pagingOptions, postId, replyId);
  }

  @Mutation((returns) => CommentResponse, { description: 'コメントを投稿する。' })
  @Authorized()
  async createComment(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => CreateCommentInput) createCommentInput: CreateCommentInput,
  ): Promise<Comment> {
    return await this.commentService.createComment(currentUser, createCommentInput);
  }

  @Mutation((returns) => CommentResponse, { description: 'コメントを投稿する。' })
  @Authorized()
  async editComment(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => EditCommentInput) editCommentInput: EditCommentInput,
  ): Promise<Comment> {
    return await this.commentService.editComment(currentUser, editCommentInput);
  }

  @Mutation((returns) => CommentResponse, { description: 'コメントを返信する。' })
  @Authorized()
  async replyComment(
    @GetCurrentUser() currentUser: User,
    @Arg('input', (type) => ReplyCommentInput) replyCommentInput: ReplyCommentInput,
  ): Promise<Comment> {
    return await this.commentService.replyComment(currentUser, replyCommentInput);
  }

  @Mutation((returns) => Int, { description: 'コメントを削除する。' })
  @Authorized()
  @UseMiddleware(CommentGuard)
  async deleteComment(
    @Arg('input', (type) => DeleteCommentInput) deleteCommentInput: DeleteCommentInput,
  ): Promise<number> {
    return await this.commentService.deleteComment(deleteCommentInput);
  }

  @FieldResolver({ description: '返信コメントの総数を返すFieldResolver。' })
  totalReplies(@Root() comment: Comment & { _count: { [key: string]: number } }): number {
    return comment._count.replies;
  }
}
