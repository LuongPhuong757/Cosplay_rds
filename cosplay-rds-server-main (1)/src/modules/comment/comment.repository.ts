import { PagingOptionsQuery } from '@interfaces';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Comment } from './comment.model';

@Service()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async fetchComments(
    pagingOptionsQuery: PagingOptionsQuery,
    postId: number,
    replyId?: number,
  ): Promise<Comment[]> {
    const query = replyId ? { replyId } : { replyId: null };

    return await this.prisma.comment.findMany({
      ...pagingOptionsQuery,
      orderBy: [
        {
          created: 'desc',
        },
      ],
      where: {
        postId,
        ...query,
      },
      include: {
        user: true,
        superChat: {
          include: {
            user: true,
            price: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });
  }
}
