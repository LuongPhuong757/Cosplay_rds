import config from '@config';
import request, { RequestInstance } from '@providers/request.provider';
import { AxiosError } from 'axios';
import { Service } from 'typedi';
import { Auth0User } from 'interfaces';

const { clientId, clientSecret, audience } = config.auth0;

@Service()
export class Auth0Provider {
  async getOauthToken(): Promise<string> {
    try {
      const headers = {
        'content-type': 'application/json',
      };
      const body = {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      };

      const res = await request.client.post('oauth/token', body, { headers });
      if (res.status !== 200) {
        throw new Error(`request failed status code: ${res.status}. POST api/v2/oauth/token.`);
      }
      const { access_token } = res.data as {
        access_token: string;
        scope: string;
        expires_in: number;
        token_type: string;
      };

      return access_token;
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot get access token from auth0. message: ${message}.`);
    }
  }

  async deleteAccount(token: string, auth0Id: string): Promise<void> {
    try {
      const headers = RequestInstance.getHeaders(token);

      const res = await request.client.delete(`api/v2/users/${auth0Id}`, { headers });
      if (res.status !== 204) {
        throw new Error(`request failed status code: ${res.status}. DELETE api/v2/users.`);
      }
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot delete account on auth0. message: ${message} auth0Id: ${auth0Id}.`);
    }
  }

  async getUser(token: string, auth0Id: string): Promise<Auth0User> {
    try {
      const headers = RequestInstance.getHeaders(token);

      const res = await request.client.get(`api/v2/users/${auth0Id}`, { headers });
      if (res.status !== 200) {
        throw new Error(`request failed status code: ${res.status}. GET api/v2/users`);
      }

      return res.data as Auth0User;
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot get user from auth0. message: ${message} auth0Id: ${auth0Id}.`);
    }
  }

  async getUsersByEmail(token: string, email: string): Promise<Auth0User[]> {
    try {
      const headers = RequestInstance.getHeaders(token);

      const res = await request.client.get(`api/v2/users-by-email?email=${email}`, {
        headers,
      });
      if (res.status !== 200) {
        throw new Error(`request failed status code: ${res.status}. GET api/v2/users-by-email`);
      }

      return res.data as Auth0User[];
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot get users by email. message: ${message}.`);
    }
  }

  async updateUser<T>(token: string, auth0Id: string, body: T): Promise<Auth0User> {
    try {
      const headers = RequestInstance.getHeaders(token);

      const res = await request.client.patch(`api/v2/users/${auth0Id}`, body, { headers });
      if (res.status !== 200) {
        throw new Error(`request failed status code: ${res.status}. PATCH api/v2/users`);
      }

      return res.data as Auth0User;
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot update user from auth0. message: ${message} auth0Id: ${auth0Id}.`);
    }
  }

  async linkAccount(
    token: string,
    primaryAuth0Id: string,
    secondaryAuth0Id: string,
    secondaryAuthProvider: string,
  ): Promise<void> {
    try {
      const headers = RequestInstance.getHeaders(token);
      const body = {
        user_id: secondaryAuth0Id,
        provider: secondaryAuthProvider,
      };

      const res = await request.client.post(`api/v2/users/${primaryAuth0Id}/identities`, body, {
        headers,
      });
      if (res.status !== 201) {
        throw new Error(
          `request failed status code: ${res.status}. POST api/v2/users/primaryAuthId`,
        );
      }
    } catch (e) {
      const { message } = <AxiosError>e;
      console.error(message);

      throw Error(`cannot link account. message: ${message}.`);
    }
  }
}
