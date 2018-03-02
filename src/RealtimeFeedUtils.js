//@flow
import alarm from 'alarm';
import axios from 'axios';
import xml2js from 'xml2js';


var parseString = xml2js.parseString;
var realtimeFeedAlarm;

var realtimeFeed = []

function xmlToJson(xml: String) {
    parseString(xml, function (err, result) {
        if (err) {
            console.log(err);
        }

        if (result) {
           realtimeFeed = result.FeedMessage.Entities[0].FeedEntity.map(entity => {
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
        }
    })
}

async function fetchRealtimeFeed() {
    try {
    let realtimeReq = await axios.get('https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate&debug=true');
    xmlToJson(realtimeReq.data);
    //data is now stored in realtimeFeed
    } catch (err) { 
        console.log(err);
        console.log('couldnt get realtime feed')
    }
}

//returns the vehicleID, the delay, and anything else required
function getTrackingInformation(stopID: String, tripID: String) {
    var resp = {
        vehicleID: null,
        delay: null,
        noInfoYet: false
    }

    let filteredTrips = realtimeFeed.filter(trip => {
        return trip.tripID == tripID
    });

    //if we found a match
    if (filteredTrips.length > 0) {
        let trip = filteredTrips[0];
        let filteredStops = trip.stopUpdates.filter(stop => {
            return stop.stopID == stopID
        });
        resp.vehicleID = trip.vehicleID

        //we found the correct stop and have the correct trip
        if (filteredStops.length > 0) {
            let stop = filteredStops[0];
            resp.delay = stop.delay;
        }
    } else {
        return {
            vehicleID: null,
            delay: null,
            noInfoYet: true
        }
    }

    return resp;
}

function start() {
    realtimeFeedAlarm = alarm.recurring(30000, fetchRealtimeFeed)
    fetchRealtimeFeed()
} 

//call realtimeFeedAlarm() to cancel recurring call

export default {
    start: start,
    getTrackingInformation: getTrackingInformation
};