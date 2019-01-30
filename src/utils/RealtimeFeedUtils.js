// @flow
import LogUtils from './LogUtils';
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';

async function fetchRTF() : Object {
    const options = {
        method: 'GET',
        url: 'http://live-tracking:5000',
        headers: { 'Cache-Control': 'no-cache' },
    };
    const data = await RequestUtils.createRequest(options, 'Tracking request failed');
    return JSON.parse(data);
}

/**
 * Given an array of { stopID, routeID, [tripID] },
 * Return bus and tracking data including location
 * Input:
 [
 {
   “stopID” : String,
   “routeID” : String,
   “tripIdentifiers” : [String]
 },
 …
 ]
 */
async function getTrackingResponse(trackingRequests: Object) : Object {
    LogUtils.log({ message: 'getTrackingResponse: entering function' });

    const trackingInformation = [];
    let noData = false;
    const rtf = await fetchRTF(); // ensures the realtimeFeed doesn't update in the middle of execution

    LogUtils.log({ message: 'getTrackingResponse: await realtimeFeed' });
    LogUtils.log({ category: 'getTrackingResponse', rtf, trackingRequests });

    // for each input
    await Promise.all(trackingRequests.map(async (data): Promise<boolean> => {
        const { stopID, routeID, tripIdentifiers } = data;
        const realtimeDelayData = getTrackingInformation(stopID, tripIdentifiers[0], rtf);

        if (realtimeDelayData) {
            LogUtils.log({ category: 'getTrackingResponse', realtimeDelayData });

            const authHeader = await TokenUtils.fetchAuthHeader();
            const options = {
                method: 'GET',
                url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Vehicles/GetAllVehiclesForRoute',
                headers: {
                    Authorization: authHeader,
                    'Cache-Control': 'no-cache',
                    'Postman-Token': 'b688b636-87ea-4e04-9f3e-ba34e811e639',
                },
                qs: { routeID },
            };

            const trackingRequest = await RequestUtils.createRequest(options, 'Tracking request failed');
            if (!trackingRequest) return false;

            /**
             * Parse request to object and map valid realtime data to info for each bus
             */
            const busFound = JSON.parse(trackingRequest) // parse the request
                .find( // find the first tracking data matching the vehicleId
                    busInfo => busInfo.VehicleId === realtimeDelayData.vehicleId,
                );

            if (!busFound) return false;

            const trackingData = ((busInfo) => { // create object and return
                let lastUpdated = busInfo.LastUpdated;
                const firstParan = lastUpdated.indexOf('(') + 1;
                const secondParan = lastUpdated.indexOf('-');
                lastUpdated = parseInt(lastUpdated.slice(firstParan, secondParan));
                return {
                    case: 'validData',
                    commStatus: busInfo.CommStatus,
                    delay: realtimeDelayData.delay,
                    destination: busInfo.Destination,
                    deviation: busInfo.Deviation,
                    direction: busInfo.Direction,
                    displayStatus: busInfo.DisplayStatus,
                    gpsStatus: busInfo.GPSStatus,
                    heading: busInfo.Heading,
                    lastStop: busInfo.LastStop,
                    lastUpdated,
                    latitude: busInfo.Latitude,
                    longitude: busInfo.Longitude,
                    name: busInfo.Name,
                    opStatus: busInfo.OpStatus,
                    routeID: busInfo.RouteId,
                    runID: busInfo.RunId,
                    speed: busInfo.Speed,
                    tripID: busInfo.TripId,
                    vehicleID: busInfo.VehicleId,
                };
            })(busFound);

            LogUtils.log({ message: 'getTrackingResponse: validData', trackingData });

            // we have tracking data for the bus
            if (trackingData) {
                trackingInformation.push(trackingData);
            } else {
                noData = true;
                return false;
            }
            return true;
        }
        return false;
    })).catch((err) => {
        LogUtils.logErr(err, trackingRequests, 'Tracking error');
        throw err;
    });

    if (await trackingInformation && trackingInformation.length > 0) {
        return trackingInformation;
    }

    if (noData) return { case: 'noData' };

    LogUtils.log({ message: 'getTrackingResponse: invalid data', trackingInformation });
    return { case: 'invalidData' };
}

/**
 * Returns a { vehicleID, delay } object
 * @param stopID
 * @param tripID
 * @param rtf
 * @returns Object
 */
function getTrackingInformation(stopID: String, tripID: String, rtf: Object) : ?Object {
    // rtf param ensures the realtimeFeed doesn't update in the middle of execution
    // if invalid params or the trip is inactive
    if (!stopID
        || !tripID
        || !(rtf)
        || !(rtf[tripID])) {
        LogUtils.log({
            category: 'getTrackingInformation NULL',
            rtf,
            stopID,
            tripID,
        });
        return null;
    }

    const info = rtf[tripID];

    let delay = parseInt(info.stopUpdates && info.stopUpdates[stopID]);
    if (Number.isNaN(delay)) delay = parseInt(info.delay);

    return {
        delay,
        vehicleId: parseInt(info.vehicleId),
    };
}

// Wrapper over getTrackingInformation, will deprecate in the future
async function getDelayInformation(stopID: String, tripID: String) : ?Object {
    const rtf = await fetchRTF();
    return getTrackingInformation(stopID, tripID, rtf);
}

export default {
    fetchRTF,
    getDelayInformation,
    getTrackingInformation,
    getTrackingResponse,
};
