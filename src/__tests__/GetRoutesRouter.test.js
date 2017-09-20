/* eslint-disable no-undef */
import API from '../API';
import request from 'supertest-as-promised';

const app = new API().express;

describe('GetAllStopsRouter Success Test', () => {
  it('Assert response body contains success and data', () => {
    return request(app).get('/api/v1/routes/')
      .expect(200)
      .then((res) => {
        const reqKeys = ['success', 'data'];
        const item = res.body;
        // Assert that reqKeys are present in response
        reqKeys.forEach((key) => {
          expect(Object.keys(item)).toContain(key);
        });

        expect(item.success).toEqual(true);
      });
  });

});
