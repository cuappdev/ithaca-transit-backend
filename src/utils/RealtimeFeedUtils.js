// @flow
import alarm from 'alarm';
import xml2js from 'xml2js';
import request from 'request';
import ErrorUtils from './ErrorUtils';

const { parseString } = xml2js;

let tripRealtimeFeed = [];
let vehicleRealtimeFeed = [];

function xmlToJson(xml: String, forTrip: boolean) {
    parseString(xml, (err, result) => {
        if (err) {
            ErrorUtils.log(err, null, 'Parse XML string error');
        }

        try {
            if (result && forTrip) {
                tripRealtimeFeed = result.FeedMessage.Entities[0].FeedEntity.map((entity) => {
                    let vehicleID = null;
                    const tripUpdate = entity.TripUpdate[0];
                    const trip = tripUpdate.Trip[0];
                    if (tripUpdate.Vehicle != null) {
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
            } else if (result) { // means we are here for the vehicle realtime data
                vehicleRealtimeFeed = result.FeedMessage.Entities[0].FeedEntity.map((entity) => {
                    if (entity.Vehicle && entity.Vehicle[0].Trip) {
                        return entity.Vehicle[0].Trip[0].TripId[0];
                    }
                    return null;
                });
            }
        } catch (e) {
            ErrorUtils.log(e, result, 'Could not convert xml to JSON');
        }
        return null;
    });
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

        const realtimeReq = await new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                resolve(body);
            });
        }).then(value => value).catch((error) => {
            ErrorUtils.log(error, null, 'Vehicle realtime request failed');
            return null;
        });

        xmlToJson(realtimeReq, false);
    } catch (err) {
        ErrorUtils.log(err, null, 'Couldn\'t fetch vehicle realtime feed');
    }
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

        const realtimeReq = await new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                resolve(body);
            });
        }).then(value => value).catch((error) => {
            ErrorUtils.log(error, null, 'Trip realtime request failed');
            return null;
        });

        xmlToJson(realtimeReq, true);
        // data is now stored in tripRealtimeFeed
    } catch (err) {
        ErrorUtils.log(err, null, 'Couldn\'t fetch trip realtime feed');
    }
}

function getDelay(stopID: String, tripID: String) {
    let delay = null;
    if (vehicleRealtimeFeed.indexOf(tripID) === -1) {
        return delay;
    }

    const filteredTrips = tripRealtimeFeed.filter(trip => trip.tripID === tripID);

    if (filteredTrips.length > 0) {
        const trip = filteredTrips[0];
        const filteredStops = trip.stopUpdates.filter(stop => stop.stopID === stopID);

        if (filteredStops.length > 0) {
            const stop = filteredStops[0];
            delay = stop.delay;
        }
    }
    return parseInt(delay);
}

// returns the vehicleID, the delay, and anything else required
function getTrackingInformation(stopID: String, tripIDs: String[]) {
    const resp = {
        vehicleID: null,
        delay: null,
        noInfoYet: false,
    };

    let foundTripInfo = false;
    for (let index = 0; index < tripIDs.length; index++) {
        if (foundTripInfo) {
            break;
        }
        const tripID = tripIDs[index];
        const filteredTrips = tripRealtimeFeed.filter(trip => trip.tripID === tripID);

        // we found a tripID in the realtime feed and it is an active trip
        if (filteredTrips.length > 0 && vehicleRealtimeFeed.indexOf(tripID) !== -1) {
            foundTripInfo = true;
            const trip = filteredTrips[0];
            const filteredStops = trip.stopUpdates.filter(stop => stop.stopID === stopID);
            resp.vehicleID = trip.vehicleID;

            if (filteredStops.length > 0) {
                const stop = filteredStops[0];
                resp.delay = stop.delay;
            }
        }
    }

    if (foundTripInfo) {
        return resp;
    }
    return {
        vehicleID: null,
        delay: null,
        noInfoYet: true,
    };
}

function start() {
    alarm.recurring(30000, fetchTripRealtimeFeed);
    alarm.recurring(15000, fetchVehicleRealtimeFeed);
    fetchTripRealtimeFeed();
    fetchVehicleRealtimeFeed();
}

// call realtimeFeedAlarm() to cancel recurring call

export default {
    start,
    getTrackingInformation,
    getDelay,
};
