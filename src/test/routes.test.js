/* eslint-disable no-console */
// must use require with supertest...
const request = require('supertest');
const { init, server } = require('../server');
const ErrorUtils = require('../utils/ErrorUtils');

let ready = false;
const root = '/api/v1';

beforeAll(async () => init.then((res) => {
    ready = true;
    return true;
}).catch((res) => {
    ErrorUtils.log(res, null, 'Server init failed!');
    return false;
}), 1000);

describe('Initialization and root path', () => {
    const helloWorld = `${root}/`;

    test('Initialized', () => expect(ready).toBe(true));

    test(helloWorld, () => request(server).get(helloWorld).expect(200));
});

describe('allStops', () => {
    const allStops = `${root}/allStops/`;

    test(allStops, () => request(server).get(allStops).expect(200));

    // TODO
});

describe('alerts', () => {
    const alerts = `${root}/alerts/`;

    test(alerts, () => request(server).get(alerts).expect(200));

    // TODO
});

describe('delay', () => {
    const delay = `${root}/delay/`;

    test(delay, () => request(server).get(delay).expect(200));

    // TODO
});

describe('route', () => {
    const places = `${root}/route/`;

    test(places, () => request(server).get(places).expect((res) => {
        if (res.statusCode !== 200) throw new Error('Bad status code ', res.statusCode);
        if (res.body.success === true) throw new Error('Empty request body returned successfully', res.statusCode);
    }));

    // TODO
});

describe('places', () => {
    const places = `${root}/places/`;

    test(places, () => request(server).get(places).expect(404));

    // TODO
});

describe('tracking', () => {
    const places = `${root}/tracking/`;

    test(places, () => request(server).get(places).expect(404));

    // TODO
});
