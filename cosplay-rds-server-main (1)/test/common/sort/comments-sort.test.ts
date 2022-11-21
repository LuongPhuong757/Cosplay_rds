import { commentsSort } from '@common/sort/comments-sort';

describe('commentsSort', () => {
  it('all comments have no superchat. sort by created.', () => {
    const comments = [
      {
        id: 1,
        comment: 'test1Comment',
        postId: 1,
        userId: 1,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-06T08:23:05.307Z'),
      },
      {
        id: 2,
        comment: 'test2Comment',
        postId: 2,
        userId: 2,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-07T08:23:05.307Z'),
      },
    ];
    const sorted = comments.sort(commentsSort);

    expect(sorted[0].id).toEqual(2);
  });

  it('only B have superchat.', () => {
    const comments = [
      {
        id: 2,
        comment: 'test2Comment',
        postId: 2,
        userId: 2,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-07T08:23:05.307Z'),
      },
      {
        id: 1,
        comment: 'test1Comment',
        postId: 1,
        userId: 1,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-06T08:23:05.307Z'),
        superChat: {
          id: 1,
          priceId: 1,
          userId: 1,
          commentId: 1,
          paymentIntentId: 'commentSortPaymentIntentId1',
          user: {
            id: 1,
            account: 'test1Account',
            auth0Id: 'test1Auth0Id',
            name: 'test1Name',
            icon: 'test1Icon',
            profile: 'test1Profile',
            website: 'test1Website',
            manageOfficeId: null,
            belongOfficeId: null,
            isBan: false,
            isCosplayer: false,
            snsInfo: null,
          },
          price: {
            id: 1,
            amount: 100,
            currency: 'jpy',
            jpy: 100,
          },
        },
      },
    ];
    const sorted = comments.sort(commentsSort);

    expect(sorted[0].id).toEqual(1);
  });

  it('only A have superchat.', () => {
    const comments = [
      {
        id: 2,
        comment: 'test2Comment',
        postId: 2,
        userId: 2,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-07T08:23:05.307Z'),
        superChat: {
          id: 1,
          priceId: 1,
          userId: 1,
          commentId: 1,
          paymentIntentId: 'commentSortPaymentIntentId2',
          user: {
            id: 1,
            account: 'test1Account',
            auth0Id: 'test1Auth0Id',
            name: 'test1Name',
            icon: 'test1Icon',
            profile: 'test1Profile',
            website: 'test1Website',
            isBan: false,
            isCosplayer: false,
            manageOfficeId: null,
            belongOfficeId: null,
            snsInfo: null,
          },
          price: {
            id: 1,
            amount: 100,
            currency: 'jpy',
            jpy: 100,
          },
        },
      },
      {
        id: 1,
        comment: 'test1Comment',
        postId: 1,
        userId: 1,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-06T08:23:05.307Z'),
      },
    ];
    const sorted = comments.sort(commentsSort);

    expect(sorted[0].id).toEqual(2);
  });

  it('both have superchat.', () => {
    const comments = [
      {
        id: 2,
        comment: 'test2Comment',
        postId: 2,
        userId: 2,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-07T08:23:05.307Z'),
        superChat: {
          id: 2,
          priceId: 2,
          userId: 2,
          commentId: 2,
          paymentIntentId: 'commentSortPaymentIntentId3',
          user: {
            id: 2,
            account: 'test1Account',
            auth0Id: 'test1Auth0Id',
            name: 'test1Name',
            icon: 'test1Icon',
            profile: 'test1Profile',
            website: 'test1Website',
            isBan: false,
            isCosplayer: false,
            manageOfficeId: null,
            belongOfficeId: null,
            snsInfo: null,
          },
          price: {
            id: 2,
            amount: 100,
            currency: 'jpy',
            jpy: 100,
          },
        },
      },
      {
        id: 1,
        comment: 'test1Comment',
        postId: 1,
        userId: 1,
        replyId: null,
        superchatId: null,
        created: new Date('2021-06-06T08:23:05.307Z'),
        superChat: {
          id: 1,
          priceId: 1,
          userId: 1,
          commentId: 1,
          paymentIntentId: 'commentSortPaymentIntentId4',
          user: {
            id: 1,
            account: 'test1Account',
            auth0Id: 'test1Auth0Id',
            name: 'test1Name',
            icon: 'test1Icon',
            profile: 'test1Profile',
            website: 'test1Website',
            isBan: false,
            isCosplayer: false,
            manageOfficeId: null,
            belongOfficeId: null,
            snsInfo: null,
          },
          price: {
            id: 1,
            amount: 200,
            currency: 'jpy',
            jpy: 200,
          },
        },
      },
    ];
    const sorted = comments.sort(commentsSort);

    expect(sorted[0].id).toEqual(1);
  });
});
