// @flow
import Location from './models/Location';
import Stop from './models/Stop';
import TimedStop from './models/TimedStop';

import csvjson from 'csvjson';
import d3 from 'd3-collection';
import fs from 'fs';
import path from 'path';

type RouteJSON = {
  route_id: number,
  agency_id: number,
  route_short_name: number,
  route_long_name: string,
  route_type: number
};

type StopJSON = {
  stop_id: number,
  stop_code: number,
  stop_name: string,
  stop_lat: number,
  stop_lon: number
};

type TripJSON = {
  route_id: number,
  service_id: number,
  trip_id: string,
  trip_headsign: string,
  direction_id: number,
  block_id: number,
  shape_id: string
};

type StopTimeJSON = {
  trip_id: string,
  stop_id: number,
  arrival_time: string,
  departure_time: string,
  stop_sequence: number,
  timepoint: number
};

const routesFile: Array<RouteJSON> = (() => {
  var data = fs.readFileSync(
    path.join(__dirname, '../gtfs/routes.txt'),
    { encoding: 'utf8' });
  var jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.route_id = +d.route_id;
    d.agency_id = +d.agency_id;
    d.route_short_name = +d.route_short_name;
    d.route_type = +d.route_type;
    return d;
  });
})();

const stopsFile: Array<StopJSON> = (() => {
  var data = fs.readFileSync(
    path.join(__dirname, '../gtfs/stops.txt'),
    { encoding: 'utf8' });
  var jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.stop_id = +d.stop_id;
    d.stop_code = +d.stop_code;
    d.stop_lat = +d.stop_lat;
    d.stop_lon = +d.stop_lon;
    return d;
  });
})();

const tripsFile: Array<StopJSON> = (() => {
  var data = fs.readFileSync(
    path.join(__dirname, '../gtfs/trips.txt'),
    { encoding: 'utf8' });
  var jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.route_id = +d.route_id;
    d.service_id = +d.service_id;
    d.direction_id = +d.direction_id;
    d.block_id = +d.block_id;
    return d;
  });
})();

const stopTimesFile: Array<StopTimeJSON> = (() => {
  var data = fs.readFileSync(
    path.join(__dirname, '../gtfs/trips.txt'),
    { encoding: 'utf8' });
  var jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.stop_id = +d.route_id;
    d.stop_sequence = +d.service_id;
    d.timepoint = +d.timepoint;
    return d;
  });
})();

const routes = routesFile;

// Convert to stops
const stops: Array<Stop> = stopsFile.map(s => {
  const location = new Location(s.stop_lat, s.stop_lon);
  return new Stop(s.stop_name, location);
});

const nameToStopIndex = {};
for (let i = 0; i < stops.length; i++) {
  nameToStopIndex[stops[i].name] = i;
}

const trips = d3.nest()
  .key(d => d.service_id)
  .key(d => d.route_id)
  .key(d => d.trip_id)
  .entries(tripsFile);

const stopTimes = d3.nest()
  .key(d => d.trip_id)
  .entries(stopTimesFile);

const dayToServiceID = [15, 15, 15, 16, 14, 12, 13];

const xxx = (() => {
  let paths = [];
  for (let i = 0; i < trips.length; i++) {
    let serviceIDs = trips[i].values;
    for (let j = 0; j < serviceIDs.length; j++) {
      let tripIDs = serviceIDs[j].values;
      for (let k = 0; k < tripIDs.length; k++) {
        let tripID = tripIDs[0].key;
        let tripTimes = stopTimes.find(d => d.key == tripID).values;
        let yyy = [];
        for (let l = 0; l < tripTimes.length; l++) {
          let stopID: number = tripTimes[l].stop_id;
          let isTimepoint = tripTimes[l].timepoint == 1;
          let stop = stopsFile.find(d => d.stop_id == stopID);
          yyy.push(new TimedStop(new Stop(stop.stop_name, new Location(stop.stop_lat, stop.stop_lon)), , isTimepoint));
        }
        paths.push(yyy);
      }
    }
  }
  return paths
})();

//console.log(trips);

export default {
  routes,
  stops,
  trips,
  stopTimes,
  nameToStopIndex
};
