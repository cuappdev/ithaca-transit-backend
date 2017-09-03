// @flow
import Location from './models/Location';
import Stop from './models/Stop';
import TimedStop from './models/TimedStop';
import Path from './models/Path';
import Bus from './models/Bus';

import TimeUtils from './utils/TimeUtils';
import GeoUtils from './geo/GeoUtils';

import csvjson from 'csvjson';
import * as d3 from 'd3-collection';
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

type CalendarDateJSON = {
  service_id: number,
  date: number,
  exception_type: number;
};

const routesFile: Array<RouteJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/routes.txt'),
    { encoding: 'utf8' });
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.route_id = +d.route_id;
    d.agency_id = +d.agency_id;
    d.route_short_name = +d.route_short_name;
    d.route_type = +d.route_type;
    return d;
  });
})();

const stopsFile: Array<StopJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/stops.txt'),
    { encoding: 'utf8' });
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.stop_id = +d.stop_id;
    d.stop_code = +d.stop_code;
    d.stop_lat = +d.stop_lat;
    d.stop_lon = +d.stop_lon;
    return d;
  });
})();

const tripsFile: Array<StopJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/trips.txt'),
    { encoding: 'utf8' });
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.route_id = +d.route_id;
    d.service_id = +d.service_id;
    d.direction_id = +d.direction_id;
    d.block_id = +d.block_id;
    return d;
  });
})();

const stopTimesFile: Array<StopTimeJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/stop_times.txt'),
    { encoding: 'utf8' });
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.stop_id = +d.stop_id;
    d.stop_sequence = +d.stop_sequence;
    d.timepoint = +d.timepoint;
    return d;
  });
})();

const calendarDatesFile: Array<CalendarDateJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/calendar_dates.txt'),
    { encoding: 'utf8' });
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.service_id = +d.service_id;
    d.date = +d.date;
    d.exception_type = +d.exception_type;
    return d;
  });
})();

const stopFromStopJSON = (s: Object) => {
  const location = new Location(s.stop_lat, s.stop_lon);
  return new Stop(s.stop_name, location);
};

// Convert to stops
const stops: Array<Stop> = stopsFile.map(stopFromStopJSON);

const buses = async (): Promise<Array<Bus>> => {
  const trips = d3.nest()
    .key(d => d.service_id)
    .key(d => d.route_id)
    .key(d => d.trip_id)
    .entries(tripsFile);

  const stopTimes = d3.nest()
    .key(d => d.trip_id)
    .entries(stopTimesFile);

  let result: Array<Bus> = [];
  let preprocessBus = [];
  for (let i = 0; i < trips.length; i++) {
    const routeID = trips[i].key;
    const routeNumber =
      (routesFile.find(d => d.route_id === routeID) || {}).route_short_name;
    const serviceIDs = trips[i].values;

    let paths = [];
    let preprocessJourneys = [];
    for (let j = 0; j < serviceIDs.length; j++) {
      const serviceID = serviceIDs[j].key;
      const tripIDs = serviceIDs[j].values;
      let timedStops = [];

      for (let k = 0; k < tripIDs.length; k++) {
        let tripID = tripIDs[k].key;
        let tripTimes = stopTimes.find(d => d.key === tripID).values;

        for (let l = 0; l < tripTimes.length; l++) {
          const stopID = tripTimes[l].stop_id;
          const isTimepoint = tripTimes[l].timepoint === 1;
          const stopJSON: Object =
            stopsFile.find(d => d.stop_id === stopID) || {};
          const stop = stopFromStopJSON(stopJSON);
          let time = 0;
          if (isTimepoint) {
            time = TimeUtils.stringTimeToWeekTime(tripTimes[l].arrival_time);
          }
          const timedStop = new TimedStop(stop, time, isTimepoint);

          // TODO: Fix interpolation so that this isnt necessary
          if (isTimepoint) {
            timedStops.push(timedStop);
          }
        }

        preprocessJourneys.push({stops: timedStops});
        const path = new Path(serviceID, timedStops);
        paths.push(path);
      }
    }
    preprocessBus.push({journeys: preprocessJourneys});
    const bus = new Bus(paths, routeNumber);
    result.push(bus);
  }
  await GeoUtils.interpolateTimes(preprocessBus, stops, nameToStopIndex);
  return result;
};

const nameToStopIndex = {};
for (let i = 0; i < stops.length; i++) {
  nameToStopIndex[stops[i].name] = i;
}

// console.log(trips);

export default {
  buses,
  stops,
  nameToStopIndex
};
