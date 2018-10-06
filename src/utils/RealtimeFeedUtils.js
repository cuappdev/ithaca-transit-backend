// @flow
import alarm from 'alarm';
import xml2js from 'xml2js';
import request from 'request';
import RequestUtils from './RequestUtils';
import ErrorUtils from './ErrorUtils';

let tripRealtimeFeed = RequestUtils.fetchRetry(fetchTripRealtimeFeed);
let vehicleRealtimeFeed = RequestUtils.fetchRetry(fetchTripRealtimeFeed);

function xmlToJSON(xml: String) {
    let r = null;
    xml2js.parseString(xml, (err, result) => {
        if (err) {
            throw ErrorUtils.logErr(err, null, 'Parse XML string error');
        }
        r = result;
    });
    return r;
}

function parseTripFeedJSON(result) {
    if (!result
        || !result.FeedMessage
        || !result.FeedMessage.Entities.length > 0
        || !result.FeedMessage.Entities[0].FeedEntity) {
        return null;
    }
    // tripRealtimeFeed =
    try {
        return result.FeedMessage.Entities[0].FeedEntity.map((entity) => {
            let vehicleID = null;
            const tripUpdate = entity.TripUpdate[0];
            const trip = tripUpdate.Trip[0];
            if (tripUpdate.Vehicle && tripUpdate.Vehicle.length > 0) {
                const vehicle = tripUpdate.Vehicle[0];
                vehicleID = vehicle.Id[0];
            }
            const stopTimeUpdates = tripUpdate.StopTimeUpdates[0];
            let stopUpdates = stopTimeUpdates.StopTimeUpdate;
            stopUpdates = stopUpdates.map(stopInfo => ({
                stopID: stopInfo.StopId[0],
                delay: stopInfo.Departure[0].Delay[0],
            }));
            return {
                tripID: trip.TripId[0],
                vehicleID,
                stopUpdates,
            };
        });
    } catch (e) {
        ErrorUtils.logErr(e, result, 'Could not parse trip feed JSON');
    }
    return null;
}

function parseVehicleFeedJSON(result) {
    if (!result
        || !result.FeedMessage
        || !result.FeedMessage.Entities.length > 0
        || !result.FeedMessage.Entities[0].FeedEntity) {
        return null;
    }
    // vehicleRealtimeFeed =
    try {
        return result.FeedMessage.Entities[0].FeedEntity.map((entity) => {
            if (entity.Vehicle && entity.Vehicle[0].Trip) {
                return entity.Vehicle[0].Trip[0].TripId[0];
            }
            return null;
        });
    } catch (e) {
        ErrorUtils.logErr(e, result, 'Could not parse vehicle feed JSON');
    }
    return null;
}

async function fetchVehicleRealtimeFeed() {
    try {
        const options = {
            method: 'GET',
            url: 'https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate&debug=true',
            headers:
                {
                    'Cache-Control': 'no-cache',
                },
        };

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                resolve(parseVehicleFeedJSON(xmlToJSON(body)));
            });
        }).then(value => value)
            .catch((error) => {
                ErrorUtils.logErr(error, null, 'Vehicle realtime request failed');
                return null;
            });
    } catch (err) {
        ErrorUtils.logErr(err, null, 'Couldn\'t fetch vehicle realtime feed');
    }
    return null;
}

async function fetchTripRealtimeFeed() {
    try {
        const options = {
            method: 'GET',
            url: 'https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate&debug=true',
            headers:
                {
                    'Cache-Control': 'no-cache',
                },
        };

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                resolve(parseTripFeedJSON(xmlToJSON(body)));
            });
        }).then(value => value)
            .catch((error) => {
                ErrorUtils.logErr(error, null, 'Trip realtime request failed');
                return null;
            });

        // data is now stored in tripRealtimeFeed
    } catch (err) {
        ErrorUtils.logErr(err, null, 'Couldn\'t fetch trip realtime feed');
    }
    return null;
}

/**
 * Returns a { vehicleID, delay, tripID } object
 * @param stopID
 * @param tripID
 * @returns {Promise<*>}
 */
async function getTrackingInformation(stopID: String, tripID: String) {
    // if invalid params or the trip is inactive
    if (!stopID || !tripID || !(await vehicleRealtimeFeed).find(v => v.tripID === tripID)) {
        return null;
    }

    const resp = {
        vehicleID: null,
        delay: null,
        tripID: null,
    };

    const realtimeTrip = (await tripRealtimeFeed).find(trip => trip.tripID === tripID);

    if (realtimeTrip && realtimeTrip.stopUpdates) {
        const filteredStop = realtimeTrip.stopUpdates.find(stop => stop.stopID === stopID);
        resp.vehicleID = realtimeTrip.vehicleID;

        if (filteredStop) {
            resp.delay = parseInt(filteredStop.delay);
        }
    }
    return resp;
}

async function start() {
    alarm.recurring(30000, () => {
        tripRealtimeFeed = RequestUtils.fetchRetry(fetchTripRealtimeFeed, 5);
    });
    alarm.recurring(15000, () => {
        vehicleRealtimeFeed = RequestUtils.fetchRetry(fetchVehicleRealtimeFeed, 5);
    });

    // eslint-disable-next-line no-console
    // tripRealtimeFeed.then(console.log(tripRealtimeFeed));

    // eslint-disable-next-line no-console
    // vehicleRealtimeFeed.then(console.log((await vehicleRealtimeFeed)));
}

// call realtimeFeedAlarm() to cancel recurring call

export default {
    start,
    getTrackingInformation,
    vehicleRealtimeFeed,
    tripRealtimeFeed,
};
