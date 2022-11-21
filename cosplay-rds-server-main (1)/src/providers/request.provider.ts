import config from '@config';
import axios, { AxiosInstance } from 'axios';

const { apiEndPoint } = config.auth0;

export class RequestInstance {
  client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${apiEndPoint}`,
      timeout: 10000,
    });
  }

  static getHeaders(token: string): { authorization: string; 'content-type': string } {
    return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  }
}

const instance = new RequestInstance();
Object.freeze(instance);

export default instance;
