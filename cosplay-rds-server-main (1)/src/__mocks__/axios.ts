import axios from 'axios';

const mockAxios = jest.genMockFromModule<typeof axios>('axios');

mockAxios.create = jest.fn().mockImplementation(() => {
  return {
    post: jest.fn().mockResolvedValue({ status: 200, data: { access_token: 'mockAccessToken' } }),
    delete: jest.fn().mockResolvedValue({ status: 204 }),
  };
});

export default mockAxios;
