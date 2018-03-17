//@flow
import alarm from 'alarm';
import axios from 'axios';
import xml2js from 'xml2js';


var parseString = xml2js.parseString;
var realtimeTripFeedAlarm;
var realtimeVehicleFeedAlarm;

var tripRealtimeFeed = [];
var vehicleRealtimeFeed = [];
 

function xmlToJson(xml: String, forTrip: boolean) {
    parseString(xml, function (err, result) {
        if (err) {
            console.log(err);
        }

        if (result && forTrip) {
           tripRealtimeFeed = result.FeedMessage.Entities[0].FeedEntity.map(entity => {
               var vehicleID = null;
               var tripUpdate = entity.TripUpdate[0];
               var trip = tripUpdate.Trip[0];
               if (tripUpdate.Vehicle != null) {
                    let vehicle = tripUpdate.Vehicle[0];
                    vehicleID = vehicle.Id[0];
               }
               var stopTimeUpdates = tripUpdate.StopTimeUpdates[0];
               var stopUpdates = stopTimeUpdates.StopTimeUpdate;
               stopUpdates = stopUpdates.map(stopInfo => {
                  return {
                     stopID: stopInfo.StopId[0],
                     delay: stopInfo.Departure[0].Delay[0]
                  }
               });
               return {
                   tripID: trip.TripId[0],
                   vehicleID: vehicleID,
                   stopUpdates: stopUpdates
               }
           });
        } else if (result) { //means we are here for the vehicle realtime data
            vehicleRealtimeFeed = result.FeedMessage.Entities[0].FeedEntity.map(entity => {
                if (entity.Vehicle[0].Trip) {
                return entity.Vehicle[0].Trip[0].TripId[0];
                }
                return null;
            });
        }
    });
}

async function fetchVehicleRealtimeFeed() {
    try {
        let realtimeReq = await axios.get('https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=VehiclePosition&debug=true&serverid=0');
        xmlToJson(realtimeReq.data, false);
    } catch (err) {
        console.log(err);
        console.log('couldnt get vehicle realtime feed');
    }
}

async function fetchTripRealtimeFeed() {
    try {
    let realtimeReq = await axios.get('https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate&debug=true');
    xmlToJson(realtimeReq.data, true);
    //data is now stored in tripRealtimeFeed
    } catch (err) { 
        console.log(err);
        console.log('couldnt get trip realtime feed')
    }
}

function getDelay(stopID: String, tripID: String) {
    let delay = null;
    if (vehicleRealtimeFeed.indexOf(tripID) == -1) {
        return delay;
    }

    let filteredTrips = tripRealtimeFeed.filter(trip => {
        return trip.tripID == tripID;
    });

    if (filteredTrips.length > 0) {
        let trip = filteredTrips[0];
        let filteredStops = trip.stopUpdates.filter(stop => {
            return stop.stopID == stopID
        });

        if (filteredStops.length > 0) {
            let stop = filteredStops[0]
            delay = stop.delay;
        }
    }
    return parseInt(delay);
}

//returns the vehicleID, the delay, and anything else required
function getTrackingInformation(stopID: String, tripIDs: String[]) {
    var resp = {
        vehicleID: null,
        delay: null,
        noInfoYet: false
    }

    let foundTripInfo = false;
    for (let index = 0; index < tripIDs.length; index++) {
        if (foundTripInfo) {
            break;
        }

        const tripID = tripIDs[index];
        let filteredTrips = tripRealtimeFeed.filter(trip => {
            return trip.tripID == tripID;
        });

        //we found a tripID in the realtime feed and it is an active trip
        if (filteredTrips.length > 0 && vehicleRealtimeFeed.indexOf(tripID) != -1) {
            foundTripInfo = true;
            let trip = filteredTrips[0];
            let filteredStops = trip.stopUpdates.filter(stop => {
                return stop.stopID == stopID
            });
            resp.vehicleID = trip.vehicleID

            if (filteredStops.length > 0) {
                let stop = filteredStops[0];
                resp.delay = stop.delay;
            }
        }   
    }

    if (foundTripInfo) {
        return resp
    } else {
        return {
            vehicleID: null,
            delay: null,
            noInfoYet: true
        }
    }
}

function start() {
    realtimeTripFeedAlarm = alarm.recurring(30000, fetchTripRealtimeFeed);
    realtimeVehicleFeedAlarm = alarm.recurring(15000, fetchVehicleRealtimeFeed);
    fetchTripRealtimeFeed()
    fetchVehicleRealtimeFeed()
} 

//call realtimeFeedAlarm() to cancel recurring call

export default {
    start: start,
    getTrackingInformation: getTrackingInformation,
    getDelay: getDelay
};