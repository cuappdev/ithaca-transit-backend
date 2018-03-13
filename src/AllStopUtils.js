//@flow
import axios from 'axios';

let allStops;
let lastUpdated;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

async function fetchAllStops() {
    if(!allStops || !lastUpdated || Date.now() - lastUpdated > DAY_IN_MS) {
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
            lastUpdated = Date.now();
        } catch (err) {
            console.log(err);
            console.log('couldnt get all stops')
        }
    }
    return allStops;
}

function isStop(point: Object) {
    allStops = fetchAllStops();
    for(let i = 0; i < allStops.length; i++) {
        if (point.lat == allStops[i].lat && point.long == allStops[i].long) {
            return true;
        }
    }
    return false;
}

export default {
    isStop: isStop,
    fetchAllStops: fetchAllStops
};