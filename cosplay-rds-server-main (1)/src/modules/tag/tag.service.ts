import {
  getPagingOptionsQuery,
  getSubstractedPagingOptionsQuery,
} from '@common/pagination/get-paging-options-query';
import { PagingOptionsInput } from '@common/pagination/paging-options.input';
import { addUrlToObject, addUrlToTag } from '@common/util/add-url';
import { Event } from '@modules/event/event.model';
import { SettingValue } from '@modules/user-private/enum/setting-value';
import { UserPrivateSetting } from '@modules/user-private/user-private-setting.model';
import { User } from '@modules/user/user.model';
import { PrismaService } from '@services/prisma.service';
import { Service } from 'typedi';
import { Tag } from './tag.model';
import { TagRepository } from './tag.repository';

@Service()
export class TagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tagRepository: TagRepository,
  ) {}

  async tags(query: string, pagingOptions?: PagingOptionsInput): Promise<Tag[]> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const currentEventTags = await this.tagRepository.getCurrentEventTags(pagingOptionsQuery);

    const tags = await this.tagRepository.fetchTags(
      query,
      getSubstractedPagingOptionsQuery(pagingOptionsQuery, currentEventTags.length),
      {
        eventId: {
          notIn: currentEventTags.map(({ id }) => id),
        },
      },
    );

    if (pagingOptions?.offset ?? 0 > currentEventTags.length) {
      return tags.map(addUrlToTag);
    }

    return [...currentEventTags, ...tags].map(addUrlToTag);
  }

  async findTagById(tagId: number): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
      where: {
        id: tagId,
      },
      include: {
        user: true,
        event: true,
      },
    });
    if (!tag) {
      throw Error(`tag does not exist. tagId: ${tagId}.`);
    }

    return tag;
  }

  async tagsSearchForPost(
    currentUser: User,
    query: string,
    pagingOptions?: PagingOptionsInput,
  ): Promise<{ users: User[]; events: Event[] }> {
    const pagingOptionsQuery = getPagingOptionsQuery(pagingOptions);
    const users = await this.tagRepository.fetchUsersByQuery(
      currentUser,
      query,
      pagingOptionsQuery,
    );
    const filteredUsers = await this.allowTagUsers(currentUser, users);

    const currentEvents = (await this.tagRepository.getCurrentEventTags(pagingOptionsQuery)).map(
      (tag) => tag.event,
    ) as Event[];
    const events = await this.tagRepository.fetchEventsByQuery(
      query,
      getSubstractedPagingOptionsQuery(pagingOptionsQuery, currentEvents.length),
      {
        id: {
          notIn: currentEvents.map(({ id }) => id),
        },
      },
    );

    if (pagingOptions?.offset ?? 0 > currentEvents.length) {
      return {
        users: filteredUsers,
        events: [...events].map((event) => addUrlToObject(event, 'image')),
      };
    }

    return {
      users: filteredUsers,
      events: [...currentEvents, ...events].map((event) => addUrlToObject(event, 'image')),
    };
  }

  async findOrCreate({
    tagUserIds = [],
    tagEventIds = [],
  }: {
    tagUserIds: number[] | undefined;
    tagEventIds: number[] | undefined;
  }): Promise<Tag[]> {
    const inputUserIds = tagUserIds.map((id) => ({ userId: id }));
    const inputEventIds = tagEventIds.map((id) => ({ eventId: id }));

    const tags = await Promise.all(
      [...inputUserIds, ...inputEventIds].map(async (input) => {
        const tag = await this.prisma.tag.findFirst({
          where: {
            ...input,
          },
        });
        if (tag) return tag;

        return await this.prisma.tag.create({
          data: {
            ...input,
          },
        });
      }),
    );

    return tags;
  }

  private allowTagUsers = async (currentUser: User, users: User[]): Promise<User[]> => {
    const filtered = users.filter((user) => {
      const setting = user.userPrivate?.setting as UserPrivateSetting;
      if (!setting) return true;

      return setting.allowTags === SettingValue.ALL;
    });

    const followingUsers = users.filter((user) => {
      const setting = user.userPrivate?.setting as UserPrivateSetting;
      if (!setting) return false;

      return setting.allowTags === SettingValue.FOLLOW;
    });

    const filterFollowingUsers = await this.getFollowUsers(currentUser, followingUsers);

    return [...filtered, ...filterFollowingUsers];
  };

  private getFollowUsers = async (
    currentUser: User,
    settingFollowUsers: User[],
  ): Promise<User[]> => {
    const followUsers = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              in: settingFollowUsers.map(({ id }) => id),
            },
          },
          {
            followedBy: {
              some: {
                id: currentUser.id,
              },
            },
          },
        ],
      },
    });

    const filtered = settingFollowUsers.filter((tagUser) =>
      followUsers.map(({ id }) => id).includes(tagUser.id),
    );

    return filtered;
  };
}
