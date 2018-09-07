/* eslint-disable no-console */
import * as request from 'supertest';
import { init, server } from '../server';

let ready = false;

beforeAll(async () => init.then((res) => {
    ready = true;
    return true;
}).catch((res) => {
    console.log('Server init failed');
    return false;
}), 1000);

describe('Initialization and root path', () => {
    test('Initialized', () => expect(ready).toBe(true));

    // console.log(request(server).get('/api/v1/'));

    test('It should response the GET method', () => request(server).get('/').then((response) => {
        console.log(response, response.statusCode);
        expect(response.statusCode).toBe(200);
    }));
});
