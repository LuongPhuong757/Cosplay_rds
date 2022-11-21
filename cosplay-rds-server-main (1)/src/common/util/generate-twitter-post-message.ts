import config from '@config';

const { frontUrl } = config.app;

const TWITTER_MAX_LENGTH = 50;
const TWITTER_CURECOS_TITLE = '｜キュアコス[Curecos]';
const TWITTER_CURECOS_HASHTAG = '#Curecos #キュアコス';

export const generateTwitterPostMessage = (postId: number, caption: string | null): string => {
  let twitterMsg = caption ?? '';

  if (twitterMsg.length > TWITTER_MAX_LENGTH) {
    twitterMsg = twitterMsg.substring(0, TWITTER_MAX_LENGTH);
    twitterMsg = twitterMsg.concat('', '...');
  }

  return twitterMsg.concat(
    ' ',
    `${TWITTER_CURECOS_TITLE} ${frontUrl}post/${postId} ${TWITTER_CURECOS_HASHTAG}`,
  );
};
