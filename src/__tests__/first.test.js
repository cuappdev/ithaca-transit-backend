/* eslint-disable no-undef */
import API from '../API';
import request from 'supertest-as-promised';

const app = new API().express;

describe('Flow API', () => {
  it('hello test', () => {
    return request(app).get('/').expect(404);
  });
});
