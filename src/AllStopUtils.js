//@flow
import axios from 'axios';
import TokenUtils from './TokenUtils';
import alarm from 'alarm';

let allStops = [];
const HOUR_IN_MS = 1000 * 60 * 60;
let allStopsAlarm;

async function fetchAllStops() {
    if(!allStops) {
        try {
            let authHeader = await TokenUtils.getAuthorizationHeader();
            let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
                {headers: {Authorization: authHeader}});
            allStops = stopsRequest.data.map(stop => {
                return {
                    name: stop.Name,
                    lat: stop.Latitude,
                    long: stop.Longitude
                }
            });
        } catch (err) {
            throw err;
        }
    }
    return allStops;
}

function isStop(point: Object, name: string) {
    let stops  = allStops;
    stops = stops.filter(stop => {
        return stop.lat == point.lat && stop.long == point.long;
    });
    if (stops.length > 0) {
        return stops[0].name.toLowerCase() == name.toLowerCase();
    }
    return false;
}

function start() {
    allStopsAlarm = alarm.recurring(HOUR_IN_MS, fetchAllStops);
    fetchAllStops();
}

export default {
    start: start,
    isStop: isStop,
    fetchAllStops: fetchAllStops
};