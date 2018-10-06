// must use require with supertest...
const request = require('supertest');
const moment = require('moment');
const { init, server } = require('../server');
const ErrorUtils = require('../utils/ErrorUtils').default;

const {
    checkRouteValid,
    checkResponseValid,
    checkDelayResponseValid,
    checkDataResponseValid,
    checkPlacesResponseValid,
} = require('./TestUtils');

// ======================================== CONFIG ========================================

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

const routeTests = [
    {
        query: route1(afternoonYesterday),
        name: 'carpenter->schwartz @ 12pm yesterday',
    },
    {
        query: route1(afternoonToday),
        name: 'carpenter->schwartz @ 12pm today',
    },
    {
        query: route2(eveningToday),
        name: 'rpcc->chipotle @ now',
    },
    {
        query: route2(now),
        name: 'rpcc->chipotle @ 6pm today',
    },
    {
        query: route3(morningToday),
        name: 'cayuga medical center->cayuga mall @ 8am today',
    },
    {
        query: route4(lateToday),
        name: 'baker flagpole->ithaca commons-seneca street @ 11pm today',
    },
    {
        query: route4(now),
        name: 'baker flagpole->ithaca commons-seneca street @ now',
    },
];

let delayDataFoundCount = 0;
let validTrackingDataCount = 0;
let invalidTrackingDataCount = 0;
let noTrackingDataCount = 0;

// ======================================== TESTS ========================================

async function testDelay(routeResponseBusData) {
    const { stopID, tripIdentifiers } = routeResponseBusData;

    return Promise.all(tripIdentifiers.map(async (tripID): Promise<number> => {
        const delayReq = `${delay}?stopID=${stopID}&tripID=${tripID}`;
        await request(server).get(delayReq).expect((delayRes) => {
            checkDelayResponseValid(delayRes);
            delayDataFoundCount += (delayRes.body.data === null) ? 0 : 1;
        });
    }));
}

async function testTracking(routeResponseBusDataArr) {
    return request(server)
        .post(tracking)
        .send({ data: routeResponseBusDataArr })
        .set('Content-Type', 'application/json')
        .expect((res) => {
            checkResponseValid(res);
            validTrackingDataCount += (res.body.data.case === 'validData') ? 1 : 0;
            invalidTrackingDataCount += (res.body.data.case === 'invalidData') ? 1 : 0;
            noTrackingDataCount += (res.body.data.case === 'noData') ? 1 : 0;
        });
}

async function testPlaces(queryStr) {
    return request(server)
        .post(places)
        .send({ query: queryStr })
        .set('Content-Type', 'application/json')
        .expect(res => checkPlacesResponseValid(res));
}

beforeAll(async () => init.then((res) => {
    ready = true;
    return true;
}).catch((res) => {
    ErrorUtils.logErr(res, null, 'Server init failed!');
    return false;
}), 1200000);

afterAll(() => {
    if (delayDataFoundCount === 0) {
        // eslint-disable-next-line
        console.warn('/delay/ may not be working as intended: only null returned in all tests');
    }
    if (validTrackingDataCount === 0) {
        // eslint-disable-next-line
        console.warn(`/tracking/ may not be working as intended: no data or invalid in all tests\n`
        + `${invalidTrackingDataCount} invalidData (trip too far in future, no bus assigned yet)\n`
        + `${noTrackingDataCount} noData (bus does not support live tracking)`);
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
    describe('routes', () => {
        test('No error response on empty route request', () => request(server)
            .get(route)
            .expect((res) => {
                if (res.statusCode !== 200) throw new Error('Bad status code ', res.statusCode);
                if (res.body.success === true) throw new Error('Empty request body returned successfully', res.statusCode);
            }));
    });

    routeTests.forEach((routeParams) => {
        describe(routeParams.name, () => {
            let res = null;
            let busInfo = null;
            beforeAll(async () => {
                res = await request(server).get(route + routeParams.query);
            });
            test('route', () => {
                busInfo = checkRouteValid(res, true, true);
                expect(busInfo).toBeTruthy();
            });
            test('delay', async () => {
                await testDelay(busInfo[0]).catch((err) => {
                    throw ErrorUtils.logErr(err, busInfo[0], 'Delay test failed');
                });
            });
            test('tracking', async () => {
                await testTracking(busInfo).catch((err) => {
                    throw ErrorUtils.logErr(err, busInfo[0], 'Tracking test failed');
                });
            });
        });
    });
});

describe('delay endpoint', () => {
    test(`${delay}empty params`, () => request(server).get(delay).expect((res) => {
        checkDelayResponseValid(res);
    }));
});

describe('places endpoint', () => {
    test(`${places} no result for empty request body`, () => {
        request(server).post(places).expect(res => checkResponseValid(res));
    });

    test('chipotle', () => testPlaces('chipotle'));

    test('cayu?g?a?', () => {
        testPlaces('cayu');
        testPlaces('cay');
        testPlaces('cayug');
        testPlaces(' cayuga ?&* ');
    });

    test('cornell', () => {
        testPlaces('cornell');
    });
});

describe('tracking endpoint', () => {
    test(`${tracking} no result for empty request body`, () => request(server).post(tracking, {}).expect((res) => {
        checkResponseValid(res);
    }));

    // TODO
});
