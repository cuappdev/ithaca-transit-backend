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

// START - reading in all files + nesting

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

const routesNested = d3.nest()
  .key(d => d.route_id)
  .object(routesFile);

const tripsNested = (() => {
  let routeNest = d3.nest()
    .key(d => d.route_id)
    .entries(tripsFile);
  let totalNest = routeNest.map(a => {
    let serviceNest = d3.nest()
      .key(b => b.service_id)
      .entries(a.values);
    let serviceMap = {};
    serviceNest.forEach(e => {
      serviceMap[e.key] = d3.nest()
        .key(c => c.trip_id)
        .entries(e.values);
    });
    a.values = serviceMap;
    return a;
  });
  return totalNest;
})();

const stopTimesNested = d3.nest()
  .key(d => d.trip_id)
  .object(stopTimesFile);

// END - reading in all files + nesting

const stopFromStopJSON = (s: Object) => {
  const location = new Location(s.stop_lat, s.stop_lon);
  return new Stop(s.stop_name, location);
};

// Convert to stops
const stops: Array<Stop> = stopsFile.map(stopFromStopJSON);

type BusMetadata = {
  buses: {[number]: Bus},
  stopsToRoutes: {[string]: Array<number>}
};

const buses = async (serviceDate: number): Promise<BusMetadata> => {
  let stopsToRoutes: {[string]: Array<number>} = {};
  let dateIndex = calendarDatesFile.findIndex(d => d.date === serviceDate);
  let serviceIDs = calendarDatesFile
    .slice(dateIndex, dateIndex + 2)
    .map(d => d.service_id);

  stops.forEach(d => {
    stopsToRoutes[d.name] = [];
  });

  let result = {};
  let buses: Array<Bus> = [];
  let postprocessBus = [];
  for (let i = 0; i < tripsNested.length; i++) {
    const routeID = tripsNested[i].key;
    const routeNumber = routesNested[routeID][0].route_short_name;
    const serviceMap = tripsNested[i].values;

    let paths = [];
    let postprocessJourneys = [];
    for (let j = 0; j < serviceIDs.length; j++) {
      const tripIDs = serviceMap[serviceIDs[j]];
      if (!tripIDs) {
        continue;
      }
      let timedStops = [];
      for (let k = 0; k < tripIDs.length; k++) {
        let tripID = tripIDs[k].key;
        let tripTimes = stopTimesNested[tripID];

        for (let l = 0; l < tripTimes.length; l++) {
          const stopID = tripTimes[l].stop_id;
          const isTimepoint = tripTimes[l].timepoint === 1;
          const stopJSON: Object =
            stopsFile.find(d => d.stop_id === stopID) || {};
          const stop = stopFromStopJSON(stopJSON);
          stopsToRoutes[stop.name].push(routeNumber);
          let time = 0;
          if (isTimepoint) {
            time = TimeUtils.stringTimeDayToWeekTime(
              tripTimes[l].arrival_time, i
            );
          }
          const timedStop = new TimedStop(stop, time, isTimepoint);

          // TODO: Fix interpolation so that this isnt necessary
          if (isTimepoint) {
            timedStops.push(timedStop);
          }
        }

        postprocessJourneys.push({stops: timedStops});
        const path = new Path(timedStops);
        paths.push(path);
      }
    }
    postprocessBus.push({journeys: postprocessJourneys});
    const bus = new Bus(paths, routeNumber);
    buses.push(bus);
  }
  await GeoUtils.interpolateTimes(postprocessBus, stops, nameToStopIndex);
  buses.forEach(d => {
    result[d.lineNumber] = d;
  });

  stops.forEach(d => {
    let seen = {};
    stopsToRoutes[d.name] = stopsToRoutes[d.name].filter(e => {
      return seen.hasOwnProperty(e) ? false : (seen[e] = true);
    });
  });

  return {
    buses: result,
    stopsToRoutes: stopsToRoutes
  };
};

const nameToStopIndex = {};
for (let i = 0; i < stops.length; i++) {
  nameToStopIndex[stops[i].name] = i;
}

export default {
  buses,
  stops,
  nameToStopIndex
};
