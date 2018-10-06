// @flow
import alarm from 'alarm';
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';
import ErrorUtils from './ErrorUtils';

let allStops = RequestUtils.fetchRetry(fetchAllStops);
const HOUR_IN_MS = 1000 * 60 * 60;

async function fetchAllStops() {
    try {
        const authHeader = await TokenUtils.authHeader;

        const options = {
            method: 'GET',
            url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
            headers:
                {
                    'Postman-Token': 'b688b636-87ea-4e04-9f3e-ba34e811e639',
                    'Cache-Control': 'no-cache',
                    Authorization: authHeader,
                },
        };

        const stopsRequest = await RequestUtils.createRequest(options, 'allStops request failed');

        if (stopsRequest) {
            return JSON.parse(stopsRequest).map(stop => ({
                name: stop.Name,
                lat: stop.Latitude,
                long: stop.Longitude,
            }));
        }
    } catch (err) {
        ErrorUtils.logErr(err, null, 'allStops error');
        throw err;
    }

    return null;
}

async function isStop(point: Object, name: string, distance: number) {
    let stops = await allStops;
    stops = stops.filter(stop => stop.lat === point.lat && stop.long === point.long);
    if (stops.length > 0) {
        return stops[0].name.toLowerCase() === name.toLowerCase() && distance < 15.0;
    }
    return false;
}

function start() {
    alarm.recurring(HOUR_IN_MS, () => {
        allStops = RequestUtils.fetchRetry(fetchAllStops);
    });
}

export default {
    start,
    isStop,
    allStops,
};
