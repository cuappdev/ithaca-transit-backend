// @flow
import axios from 'axios';
import alarm from 'alarm';
import TokenUtils from './TokenUtils';

let allStops = [];
const HOUR_IN_MS = 1000 * 60 * 60;
let allStopsAlarm;

async function fetchAllStops() {
    try {
        const authHeader = await TokenUtils.getAuthorizationHeader();
        const stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
            { headers: { Authorization: authHeader } });
        allStops = stopsRequest.data.map(stop => ({
            name: stop.Name,
            lat: stop.Latitude,
            long: stop.Longitude,
        }));
    } catch (err) {
        console.log('got error from fetchAllStops');
        throw err;
    }
}

function getAllStops() {
    if (allStops.length == 0) {
        fetchAllStops();
    }
    return allStops;
}
function isStop(point: Object, name: string, distance: number) {
    let stops = allStops;
    stops = stops.filter(stop => stop.lat == point.lat && stop.long == point.long);
    if (stops.length > 0) {
        return stops[0].name.toLowerCase() == name.toLowerCase() && distance < 15.0;
    }
    return false;
}

function start() {
    allStopsAlarm = alarm.recurring(HOUR_IN_MS, fetchAllStops);
    fetchAllStops();
}

export default {
    start,
    isStop,
    getAllStops,
};
