export type AuthUser = {
  auth0Id: string;
};

export type DecodeEmailVerifyToken = {
  newEmail: string;
  emailVerifyToken: string;
};

type Identity = {
  provider: string;
  access_token: string;
  expires_in: number;
  user_id: string;
  connection: string;
  isSocial: boolean;
};

export type Auth0User = {
  created_at: string;
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  locale: string;
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  user_id: string;
  identities: Identity[];
  // user_metadata: {},
  app_metadata: { synced_to_rds: boolean; sync_email_verified: boolean };
  last_ip: string;
  last_login: string;
  logins_count: number;
};
