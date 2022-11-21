import { Comment } from '@modules/comment/comment.model';
import { Fav } from '@modules/fav/fav.model';
import { Photo } from '@modules/photo/photo.model';
import { Tag } from '@modules/tag/tag.model';
import { Post as PrismaPost, User } from '@prisma/client';

export type Post = {
  favs?: Fav[];
  user?: User;
  isFav?: boolean;
  comments?: Comment[];
  photos?: Photo[];
  tags?: Tag[];
} & PrismaPost;
