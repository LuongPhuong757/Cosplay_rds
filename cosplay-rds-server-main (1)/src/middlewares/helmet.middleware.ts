import config from '@config';
import expressHelmet from 'helmet';

const { isDev } = config.app;

export const helmet = expressHelmet({ contentSecurityPolicy: isDev ? false : undefined });
