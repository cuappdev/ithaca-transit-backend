const moment = require('moment');

// ======================================== CONFIG/DATA ========================================

const root = '/api/v1';
const helloWorld = `${root}/`;
const allStops = `${root}/allStops`;
const alerts = `${root}/alerts`;
const delay = `${root}/delay`;
const places = `${root}/places`;
const tracking = `${root}/tracking`;
const route = `${root}/route`;

const now = moment().unix();
const afternoonYesterday = moment().endOf('day').subtract(36, 'hours').unix();
const morningToday = moment().endOf('day').subtract(16, 'hours').unix();
const afternoonToday = moment().endOf('day').subtract(12, 'hours').unix();
const eveningToday = moment().endOf('day').subtract(6, 'hours').unix();
const lateToday = moment().endOf('day').subtract(1, 'hours').unix();

const toQS = routeInfo => `?arriveBy=${routeInfo.arriveBy}`
                        + `&end=${routeInfo.end.lat},${routeInfo.end.long}`
                        + `&start=${routeInfo.start.lat},${routeInfo.start.long}`
                        + `&time=${routeInfo.time}`
                        + `&destinationName=${routeInfo.destinationName}`;

// carpenter->schwartz
const route1Params = {
    arriveBy: false,
    end: { lat: '42.442503', long: '-76.485845' },
    start: { lat: '42.444759', long: '-76.484183' },
    destinationName: 'Schwartz',
};
const route1QS = time => toQS({ ...route1Params, time });

// rpcc->chipotle
const route2Params = {
    arriveBy: false,
    end: { lat: '42.430142', long: '-76.508216' },
    start: { lat: '42.456688', long: '-76.477035' },
    destinationName: 'Chipotle Mexican Grill',
};
const route2QS = time => toQS({ ...route2Params, time });

// cayuga medical center->cayuga mall
const route3Params = {
    arriveBy: false,
    end: { lat: '42.483673', long: '-76.485535' },
    start: { lat: '42.468266', long: '-76.537064' },
    destinationName: 'Cayuga Mall',
};
const route3QS = time => toQS({ ...route3Params, time });

// baker flagpole->ithaca commons-seneca street
const route4Params = {
    arriveBy: false,
    end: { lat: '42.440502', long: '-76.496506' },
    start: { lat: '42.447533', long: '-76.487709' },
    destinationName: 'Ithaca Commons - Seneca St',
};
const route4QS = time => toQS({ ...route4Params, time });

// plum tree->rpcc
const route5Params = {
    arriveBy: false,
    end: { lat: '42.456635', long: '-76.476936' },
    start: { lat: '42.441421', long: '-76.486485' },
    destinationName: 'Robert Purcell Community Center',
};
const route5QS = time => toQS({ ...route5Params, time });

const routeTests = [
    // {
    //     time: afternoonYesterday,
    //     query: route1QS(afternoonYesterday),
    //     name: 'carpenter->schwartz @ 12pm yesterday',
    //     params: route1Params,
    // },
    // {
    //     time: afternoonToday,
    //     query: route1QS(afternoonToday),
    //     name: 'carpenter->schwartz @ 12pm today',
    //     params: route1Params,
    // },
    // {
    //     time: eveningToday,
    //     query: route2QS(eveningToday),
    //     name: 'rpcc->chipotle @ 6pm today',
    //     params: route2Params,
    // },
    {
        time: now,
        query: route2QS(now),
        name: 'rpcc->chipotle @ now',
        params: route2Params,
    },
    // {
    //     time: morningToday,
    //     query: route3QS(morningToday),
    //     name: 'cayuga medical center->cayuga mall @ 8am today',
    //     params: route3Params,
    // },
    // {
    //     time: lateToday,
    //     query: route4QS(lateToday),
    //     name: 'baker flagpole->ithaca commons-seneca street @ 11pm today',
    //     params: route4Params,
    // },
    {
        time: now,
        query: route4QS(now),
        name: 'baker flagpole->ithaca commons-seneca street @ now',
        params: route4Params,
    },
    {
        time: now,
        query: route5QS(now),
        name: 'plum tree->rpcc @ now',
        params: route5Params,
    },
    // {
    //     time: lateToday,
    //     query: route5QS(lateToday),
    //     name: 'plum tree->rpcc @ 11pm today',
    //     params: route5Params,
    // },
];

export default {
    root,
    helloWorld,
    allStops,
    alerts,
    delay,
    places,
    tracking,
    route,
    now,
    afternoonYesterday,
    morningToday,
    afternoonToday,
    eveningToday,
    lateToday,
    routeTests,
    route1QS,
    route2QS,
    route3QS,
    route4QS,
    route5QS,
};
