// must use require with supertest...
const request = require('supertest');
const moment = require('moment');
const { init, server } = require('../server');
const ErrorUtils = require('../utils/ErrorUtils');
const {
    checkRouteValid,
    checkResponseValid,
    checkDelayResponseValid,
    checkDataResponseValid,
    checkPlacesResponseValid,
} = require('./TestUtils');

let ready = false;

const root = '/api/v1';
const helloWorld = `${root}/`;
const allStops = `${root}/allStops/`;
const alerts = `${root}/alerts/`;
const delay = `${root}/delay/`;
const places = `${root}/places/`;
const tracking = `${root}/tracking/`;
const route = `${root}/route`;

const now = moment().unix();
const afternoonYesterday = moment().endOf('day').subtract(36, 'hours').unix();
const morningToday = moment().endOf('day').subtract(16, 'hours').unix();
const afternoonToday = moment().endOf('day').subtract(12, 'hours').unix();
const eveningToday = moment().endOf('day').subtract(6, 'hours').unix();
const lateToday = moment().endOf('day').subtract(1, 'hours').unix();

// carpenter->schwartz
const route1 = time => `?start=42.444759,-76.484183&end=42.442503,-76.485845&time=${time}&arriveBy=false&destinationName="Schwartz"`;
// rpcc->chipotle
const route2 = time => `?arriveBy=false&end=42.4301429,-76.50821669999999&start=42.45668800004303,-76.47703549991579&time=${time}&destinationName="Chipotle Mexican Grill"`;
// cayuga medical center->cayuga mall
const route3 = time => `?arriveBy=false&end=42.483673,-76.485535&start=42.468266,-76.537064&time=${time}&destinationName=Cayuga Mall"`;
// baker flagpole->ithaca commons-seneca street
const route4 = time => `?arriveBy=false&end=42.440502,-76.496506&start=42.447533,-76.487709&time=${time}&destinationName=Ithaca Commons - Seneca St"`;

const route1yesterday = route1(afternoonYesterday);
const route1noon = route1(afternoonToday);

const route2evening = route2(eveningToday);
const route2now = route2(now);

const route3morning = route3(morningToday);

const route4late = route4(lateToday);

let delays = 0;

beforeAll(async () => init.then((res) => {
    ready = true;
    return true;
}).catch((res) => {
    ErrorUtils.log(res, null, 'Server init failed!');
    return false;
}), 1200000);

afterAll(() => {
    if (delays === 0) {
        // eslint-disable-next-line
        console.warn('/delay/ may not be working as intended: only null returned in all tests');
    }
});

describe('Initialization and root path', () => {
    test('Initialized', () => expect(ready).toBe(true));

    test(helloWorld, () => request(server).get(helloWorld).expect((res) => {
        checkResponseValid(res);
    }));
});

describe('allStops endpoint', () => {
    test(`${allStops} valid response`, () => request(server).get(allStops).expect((res) => {
        checkResponseValid(res);
    }));
});

describe('alerts endpoint', () => {
    test(alerts, () => request(server).get(alerts).expect((res) => {
        checkDataResponseValid(res);
    }));

    // TODO
});

describe('route, delay, & tracking endpoints', () => {
    test('No error response on empty route request', () => request(server).get(route).expect((res) => {
        if (res.statusCode !== 200) throw new Error('Bad status code ', res.statusCode);
        if (res.body.success === true) throw new Error('Empty request body returned successfully', res.statusCode);
    }));

    test('carpenter->schwartz @ 12pm yesterday', async () => request(server).get(route + route1yesterday).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));

    test('carpenter->schwartz @ 12pm today', async () => request(server).get(route + route1noon).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));

    test('rpcc->chipotle @ now', async () => request(server).get(route + route2now).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));

    test('rpcc->chipotle @ 6pm today', async () => request(server).get(route + route2evening).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));

    test('cayuga medical center->cayuga mall @ 8am today', async () => request(server).get(route + route3morning).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));

    test('baker flagpole->ithaca commons-seneca street @ 11pm today', async () => request(server).get(route + route4late).expect((res) => {
        const busInfo = checkRouteValid(res, true, true);
        testDelay(busInfo[0]);
        testTracking(busInfo);
    }));
});

async function testDelay(routeResponseBusData) {
    const { stopID, tripIdentifuers } = routeResponseBusData;
    await Promise.all(tripIdentifuers.map(async (tripID): Promise<number> => {
        const delayReq = `${delay}?stopID=${stopID}&tripID=${tripID}`;
        await request(server).get(delayReq).expect((delayRes) => {
            checkDelayResponseValid(delayRes);
            delays += (delayRes.body.data === null) ? 0 : 1;
        });
    }));
    return false;
}

async function testTracking(routeResponseBusDataArr) {
    await request(server).post(tracking, { data: routeResponseBusDataArr }).expect((res) => {
        checkResponseValid(res);
    });
    return false;
}

describe('delay endpoint', () => {
    test(`${delay}empty params`, () => request(server).get(delay).expect((res) => {
        checkDelayResponseValid(res);
    }));

    // not needed, use route data from before
    /*
    test(`${delay}route1noon`, async () => {
        await request(server).get(route + route1noon).then(async (res) => {
            const busData = checkRouteValid(res, true, true);
            const { stopID, tripIdentifuers } = busData;
            console.log(busData);

            await Promise.all(tripIdentifuers.map(async (tripID): Promise<number> => {
                const delayReq = `${delay}?stopID=${stopID}&tripID=${tripID}`;
                console.log(delayReq);
                await request(server).get(delayReq).expect((delayRes) => {
                    console.log(delayRes.body);
                    checkDelayResponseValid(delayRes);
                });
            }));
        });
    });
    */

    // TODO
});

describe('places endpoint', () => {
    test(`${places} no result for empty request body`, () => {
        request(server).post(places).expect(res => checkResponseValid(res));
    });

    test('chipotle', () => {
        request(server)
            .post(places)
            .send({ query: 'chipo' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
    });

    test('cayu?g?a?', () => {
        request(server)
            .post(places)
            .send({ query: 'cayu' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
        request(server)
            .post(places)
            .send({ query: 'cay' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
        request(server)
            .post(places)
            .send({ query: 'cayug' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
        request(server)
            .post(places)
            .send({ query: ' cayuga ?&*' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
    });

    test('cornell', () => {
        request(server).post(places)
            .send({ query: 'cornell' })
            .set('Content-Type', 'application/json')
            .expect(res => checkPlacesResponseValid(res))
            .end((err, res) => { if (err) throw err; });
    });

    // TODO
});

describe('tracking endpoint', () => {
    test(`${tracking} no result for empty request body`, () => request(server).post(tracking, {}).expect((res) => {
        checkResponseValid(res);
    }));

    // TODO
});
