import 'reflect-metadata';
import { getPagingOptionsQuery } from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { commentsSort } from '@common/sort/comments-sort';
import { InfoType } from '@modules/notification/enum/info-type';
import { NotificationService } from '@modules/notification/notification.service';
import { CommentAble } from '@modules/post/enum/comment-able';
import { ScoreLogService } from '@modules/score-log/score-log.service';
import { User } from '@modules/user/user.model';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Comment } from './comment.model';
import { CommentRepository } from './comment.repository';
import { CreateCommentInput, EditCommentInput } from './dto/input/create-comment';
import { DeleteCommentInput } from './dto/input/delete-comment';
import { ReplyCommentInput } from './dto/input/replay-comment';

@Service()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commentRepository: CommentRepository,
    private readonly notificationService: NotificationService,
    private readonly scoreLogService: ScoreLogService,
  ) {}

  async comments(
    currentUser: User,
    pagingOptions: PagingOptionsInput,
    postId: number,
    replyId?: number,
  ): Promise<Comment[]> {
    // TODO : check user can see this post.
    if (false) return [];
    const pagingQuery = getPagingOptionsQuery(pagingOptions);
    const comments = await this.commentRepository.fetchComments(pagingQuery, postId, replyId);

    return comments.sort(commentsSort);
  }

  async createComment(currentUser: User, createCommentInput: CreateCommentInput): Promise<Comment> {
    const { id } = currentUser;
    const { postId, comment } = createCommentInput;

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        commentAble: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }

    const { commentAble } = post;
    if (commentAble === CommentAble.DENY) {
      throw Error(`comment is not allowed. postId: ${postId}`);
    }

    const newComment = await this.prisma.comment.create({
      data: {
        userId: id,
        postId,
        comment,
      },
      include: {
        user: true,
      },
    });

    await this.scoreLogService.comment(postId);
    await this.createCommentNotification(id, postId, InfoType.COMMENT);

    return newComment;
  }

  async editComment(currentUser: User, editCommentInput: EditCommentInput): Promise<Comment> {
    const { id } = currentUser;
    const { commentId, postId, comment, replyId } = editCommentInput;

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        commentAble: true,
      },
    });
    if (!post) {
      throw Error(`post does not exist. postId: ${postId}.`);
    }

    const { commentAble } = post;
    if (commentAble === CommentAble.DENY) {
      throw Error(`comment is not allowed. postId: ${postId}`);
    }

    const commentFind = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        postId,
        replyId,
        userId: id,
      },
    });
    if (!commentFind) {
      throw Error(`comment does not exist. commentId: ${commentId}.`);
    }

    const newComment = await this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        comment,
      },
    });

    return newComment;
  }

  async replyComment(currentUser: User, replyCommentInput: ReplyCommentInput): Promise<Comment> {
    const { id } = currentUser;
    const { commentId, postId, comment } = replyCommentInput;

    const replyComment = await this.prisma.comment.create({
      data: {
        userId: id,
        postId,
        replyId: commentId,
        comment,
      },
      include: {
        user: true,
      },
    });

    await this.scoreLogService.comment(postId);
    await this.createCommentNotification(id, postId, InfoType.MENTION);

    return replyComment;
  }

  // TODO: SuperChat付きのReplyCommentが子に存在する場合
  // SuperChat付きのReplyComment自体は、支援者一覧で閲覧したいので消さないが、見えないようにする。
  async deleteComment(deleteCommentInput: DeleteCommentInput): Promise<number> {
    const { commentId } = deleteCommentInput;

    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        postId: true,
      },
    });

    if (!comment) {
      throw Error(`cannot delete comment ${commentId}`);
    }

    try {
      // TODO: https://github.com/prisma/prisma/discussions/2610
      // https://github.com/prisma/prisma/discussions/2664
      await this.prisma.$executeRaw<Comment>(
        `DELETE FROM "public"."Comment" WHERE id = $1;`,
        commentId,
      );

      await this.scoreLogService.comment(comment.postId, false);
    } catch (e) {
      const { message } = <Error>e;
      console.error(message);

      throw Error(`cannot delete comment. commentId: ${commentId}.`);
    }

    return commentId;
  }

  private async createCommentNotification(
    userId: number,
    postId: number,
    infoType: InfoType.COMMENT | InfoType.MENTION,
  ) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    if (!post) {
      throw Error(`cannot create comment notification. userId: ${userId} postId: ${postId}.`);
    }

    await this.notificationService.createNotification(userId, post.userId, infoType, post.id);
  }
}
