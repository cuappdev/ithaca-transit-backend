// must use require with supertest...
import TestUtils from './TestUtils';

const request = require('supertest');
const http = require('http');
const morganBody = require('morgan-body');
const url = require('url');

const { server, init, express } = require('../server');
const {
    helloWorld,
    allStops,
    alerts,
    delay,
    places,
    tracking,
    route,
    routeTests,
    routeSelected,
} = require('./TestGlobals').default;
// eslint-disable-next-line no-unused-vars
const {
    expectTests,
    printReleaseDiff,
} = require('./TestUtils').default;

// ======================================== CONFIG/DATA ========================================

// collect stats for tests
// should be used to determine correctness if responses pass all tests
let alertsCount = 0;
const routeDataCounts = {
    busInfoFound: 0,
    warning: 0,
    total: 0,
};
const delayDataCounts = {
    found: 0,
    total: 0,
};
const trackingDataCounts = {
    valid: 0,
    invalid: 0,
    none: 0,
    total: 0,
};

let running = false;

const endpointValidityTestMap = {
    [helloWorld](res) { return expectTests.toBeValid(res); },
    [allStops](res) { return expectTests.toBeValid(res); },
    [alerts](res) { return expectTests.dataToBeValid(res); },
    [delay](res) { return expectTests.delayToBeValid(res); },
    [places](res) { return expectTests.placesToBeValid(res); },
    [tracking](res) { return expectTests.toBeValid(res); },
    [route](res) { return expectTests.routeToBeValid(res); },
    [routeSelected](res) { return expectTests.dataToBeValid(res); },
};

const seenReq = new Set(); // only print results of new queries

// ======================================== BEFORE/AFTER ========================================

beforeAll(async () => {
    await init;
    morganBody(express, {
        skip: (req, res) => {
            if (!running) {
                describe('Incoming/Outgoing', () => {
                    const parsedUrl = url.parse(req.url);
                    const pathName = `${parsedUrl.pathname}`;
                    const query = `${parsedUrl.path}`;
                    if (query && !seenReq.has(query)) {
                        seenReq.add(query);
                        // eslint-disable-next-line no-underscore-dangle
                        res.body = JSON.parse(res.__morgan_body_response);
                        const out = async () => {
                            await printReleaseDiff(res.body, query);
                            const test = endpointValidityTestMap[pathName](res);
                            if (test.pass) {
                                // console.log('\x1b[36m%s\x1b[0m', `Passed Test: ${query}`);
                            } else {
                                console.error(`FAIL: ${query}`, test.message());
                            }
                        };
                        out();
                        return true;
                    }
                    return false;
                });
            }
            return true;
        },
        logRequestBody: false,
        logResponseBody: true,
    });
    running = true;
    return true;
}, 1200000);

afterAll(() => {
    if (delayDataCounts.found === 0) {
        // eslint-disable-next-line
        console.warn('WARNING: api/v1/delay/ may not be working as intended:\n'
            + `Only null returned in ${delayDataCounts.total} total tests`);
    }
    if (trackingDataCounts.valid === 0) {
        // eslint-disable-next-line
        console.warn('WARNING: api/v1/tracking/ may not be working as intended:\n'
            + 'No data or invalid data in all tests\n'
            + `${trackingDataCounts.invalid} invalidData (trip too far in future or no bus assigned yet)\n`
            + `${trackingDataCounts.none} noData (bus does not support live tracking)\n`
            + `${trackingDataCounts.total} total tracking tests`);
    }
    if (trackingDataCounts.none !== 0) {
        // eslint-disable-next-line
        console.warn('WARNING: api/v1/tracking/ may not be working as intended:\n'
            + '"noData" returned in one or more tests\n'
            + `${trackingDataCounts.invalid} invalidData (trip too far in future or no bus assigned yet)\n`
            + `${trackingDataCounts.none} noData (bus does not support live tracking)\n`
            + `${trackingDataCounts.total} total tracking tests`);
    }
    if (alertsCount === 0) {
        console.warn('WARNING: api/v1/alerts/ may not be working as inteded:\n'
            + 'No alerts found');
    }
    if (routeDataCounts.busInfoFound === 0) {
        console.error('ERROR: api/v1/route/ may not be working as intended:\n'
            + `No non-walking routes found in ${routeDataCounts.total} total tests.\n`
            + 'Delay and tracking were not tested!');
    }
    if (routeDataCounts.warning > 0) {
        console.error('ERROR: api/v1/route/ may not be working as intended:\n'
            + `${routeDataCounts.warning} warning(s) recorded in ${routeDataCounts.total} total route validation tests.\n`
            + 'See logs/out folder for most recent warning output');
    }
    running = false;
});

// ======================================== TESTS ========================================

describe('Initialization and root path', () => {
    test('Server instance', async () => expect(await server).toBeInstanceOf(http.Server));

    test(helloWorld, async () => {
        expect(await request(server).get(helloWorld)).toBeValid();
    });

    test('Initialized', async () => {
        expect(await request(server).get(`${helloWorld}?awaitInit`)).toBeValid();
    });
});

async function testDelay(delayReq) {
    if (!delayReq) return null;
    delayDataCounts.total += 1;
    const res = await request(server).get(delayReq);
    expect(res).delayToBeValid();
    delayDataCounts.found += (res.body.data === null || res.body.data === undefined) ? 0 : 1;
    return true;
}

function testDelayArr(routeResponseBusDataSet) {
    if (!routeResponseBusDataSet || routeResponseBusDataSet.size === 0) return null;
    return Promise.all(Array.from(routeResponseBusDataSet).map(async (routeResponseBusData) => {
        const { stopID, tripIdentifiers } = routeResponseBusData;
        await Promise.all(tripIdentifiers.map(async (tripID): Promise<number> => {
            const delayReq = `${delay}?stopID=${stopID}&tripID=${tripID}`;
            await testDelay(delayReq);
        }));
    }));
}

async function testTracking(routeResponseBusDataArr) {
    trackingDataCounts.total += 1;
    const res = await request(server).post(tracking).send({ data: routeResponseBusDataArr }).set('Content-Type', 'application/json');
    expect(res).toBeValid();
    for (let i = 0; i < res.body.data.length; i++) {
        const status = res.body.data[i].case;
        trackingDataCounts.valid += (status === 'validData') ? 1 : 0;
        trackingDataCounts.invalid += (status === 'invalidData') ? 1 : 0;
        trackingDataCounts.none += (status === 'noData') ? 1 : 0;
    }
}

/* eslint-disable no-param-reassign */
async function testRoute(res, routeParams) {
    const busInfo = new Set();

    routeDataCounts.total += 1;
    if (!res) {
        res = await request(server).get(route + routeParams.query);
    }

    expect(res).routeToBeValid(busInfo, routeParams);
    if (busInfo && busInfo.size > 0) {
        routeDataCounts.busInfoFound += 1;
    }

    // write res to file for visual check
    // also check difference to release
    if (!routeParams.warning) {
        routeDataCounts.warning += 1;
        // console.warn(`Warning ${routeDataCounts.warning}: Logging ${routeParams.name} to file and printing release diff [release => local]`);
        printReleaseDiff(res.body, `${route}${routeParams.query}`);
        TestUtils.logToFile('out/routes.test.warning.output.json',
            ((res && res.status < 300 && res.text) ? JSON.parse(res.text) : res));
    }

    return busInfo;
}

describe('route, delay, tracking, & selected endpoints', () => {
    routeTests.forEach((routeParams) => {
        describe(routeParams.name, () => {
            let res = null;
            let busInfo = new Promise((resolve, reject) => {
                setTimeout(reject, 5000);
            });
            beforeAll(async () => {
                res = await request(server).get(route + routeParams.query);
            });
            test('route endpoint', async () => {
                busInfo = await testRoute((await res), routeParams, busInfo);
            });
            test('delay endpoint', async () => {
                await testDelayArr((await busInfo));
            });
            test('tracking endpoint', async () => {
                await testTracking((await busInfo));
            });
            test('routeSelected endpoint', async () => {
                const msg = (await request(server)
                    .post(routeSelected)
                    .send({
                        uid: '1el', routeId: res.body.data[0].routeId,
                    })
                    .set('Content-Type', 'application/json')).body.data;
                expect(msg).toBeTruthy();
            });
        });
    });
});

describe('delay endpoint', () => {
    test(`${delay}empty params`, async () => {
        expect(await request(server).get(delay)).delayToBeValid();
    });
});

describe('places endpoint', () => {
    const getPlace = queryStr => request(server)
        .post(places)
        .send({ query: queryStr })
        .set('Content-Type', 'application/json');

    test(`${places} no result for empty request body`, async () => {
        expect((await getPlace('')).body.data).toBeNull();
    });

    // test('cayu?g?a?', async () => {
    //     expect(await getPlace('cayu')).toBeValid();
    //     expect(await getPlace('cay')).toBeValid();
    //     expect(await getPlace('cayug')).toBeValid();
    //     expect(await getPlace(' cayuga ?&* ')).dataToBeValid();
    // });
    //
    // test('cornell', async () => {
    //     expect(await getPlace('cornell')).toBeValid();
    // });
    //
    // test('chipotle', async () => {
    //     expect(await getPlace('chipotle')).toBeValid();
    // });
});

describe('allStops endpoint', () => {
    test(`${allStops} valid response`, async () => {
        expect(await request(server).get(allStops)).toBeValid();
    });
});

describe('alerts endpoint', () => {
    test(alerts, async () => {
        const res = await request(server).get(alerts);
        expect(res).dataToBeValid();
        alertsCount += res.body.data.length;
    });

    // TODO
});

describe('tracking endpoint', () => {
    // TODO
});
