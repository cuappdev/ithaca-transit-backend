// @flow
import alarm from 'alarm';
import request from 'request';
import TokenUtils from './TokenUtils';
import ErrorUtils from './ErrorUtils';

let allStops = [];
const HOUR_IN_MS = 1000 * 60 * 60;

async function fetchAllStops() {
    try {
        const authHeader = await TokenUtils.getAuthorizationHeader();

        const options = {
            method: 'GET',
            url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
            // qs: { grant_type: 'client_credentials' },
            headers:
                {
                    Authorization: authHeader,
                },
        };

        console.log(options);

        const stopsRequest = await new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                resolve(body);
            });
        }).then(value => value).catch((error) => {
            ErrorUtils.log(error, null, 'allStops request failed');
            return null;
        });

        console.log(stopsRequest);

        allStops = stopsRequest.data.map(stop => ({
            name: stop.Name,
            lat: stop.Latitude,
            long: stop.Longitude,
        }));
    } catch (err) {
        ErrorUtils.log(err, null, 'allStops error');
        throw err;
    }
}

function getAllStops() {
    if (allStops.length === 0) {
        fetchAllStops();
    }
    return allStops;
}

function isStop(point: Object, name: string, distance: number) {
    let stops = allStops;
    stops = stops.filter(stop => stop.lat === point.lat && stop.long === point.long);
    if (stops.length > 0) {
        return stops[0].name.toLowerCase() === name.toLowerCase() && distance < 15.0;
    }
    return false;
}

function start() {
    alarm.recurring(HOUR_IN_MS, fetchAllStops);
    fetchAllStops();
}

export default {
    start,
    isStop,
    getAllStops,
};
