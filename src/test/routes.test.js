/* eslint-disable no-console */
// must use require with supertest...
const request = require('supertest');
const { init, server } = require('../server');
const ErrorUtils = require('../utils/ErrorUtils');

let ready = false;
const root = '/api/v1';
const epochTime = (new Date()).getTime() / 1000;

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
    const route = `${root}/route`;

    test(route, () => request(server).get(route).expect((res) => {
        if (res.statusCode !== 200) throw new Error('Bad status code ', res.statusCode);
        if (res.body.success === true) throw new Error('Empty request body returned successfully', res.statusCode);
    }));

    const route1 = `?start=42.444759,-76.484183&end=42.442503,-76.485845&time=${epochTime}&arriveBy=false&destinationName="Schwartz"`;

    test(route + route1, () => request(server).get(route + route1).expect((res) => {
        console.log(res.body);
        if (res.statusCode !== 200) throw new Error('Bad status code ', res.statusCode);
        if (res.body.success === false) throw new Error('Route request success:false', res.statusCode);
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
