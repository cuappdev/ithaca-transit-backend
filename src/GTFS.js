// @flow
import type { PostProcessJourney, PostProcessBus } from './geo/GeoTypes';

import { Location, Stop, TimedStop, Path, Bus } from './models';
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

type ShapeJSON = {
  shape_id: string,
  shape_pt_lat: number,
  shape_pt_lon: number,
  shape_pt_sequence: number,
  shape_dist_traveled: number
};

// START - reading in all files

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
    { encoding: 'utf8' }
  );
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.stop_id = +d.stop_id;
    d.stop_code = +d.stop_code;
    d.stop_lat = +d.stop_lat;
    d.stop_lon = +d.stop_lon;
    return d;
  });
})();

const tripsFile: Array<TripJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/trips.txt'),
    { encoding: 'utf8' }
  );
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
    { encoding: 'utf8' }
  );
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
    { encoding: 'utf8' }
  );
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    d.service_id = +d.service_id;
    d.date = +d.date;
    d.exception_type = +d.exception_type;
    return d;
  });
})();

const shapesFile: Array<ShapeJSON> = (() => {
  const data = fs.readFileSync(
    path.join(__dirname, '../gtfs/shapes.txt'),
    { encoding: 'utf8' }
  );
  const jsons = csvjson.toObject(data);
  return jsons.map(d => {
    return {
      shape_id: d.shape_id,
      shape_pt_lat: +d.shape_pt_lat,
      shape_pt_lon: +d.shape_pt_lon,
      shape_pt_sequence: +d.shape_pt_sequence,
      shape_dist_traveled: +d.shape_dist_traveled
    };
  });
})();

// END - reading in all files

// START - nesting data-structures

const shapesNested: {[string]: Array<Location>} = (() => {
  const nested = d3.nest().key(d => d.shape_id).object(shapesFile);
  const keys = Object.keys(nested);
  let result = {};
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = nested[keys[i]]
      .map(e => new Location(e.shape_pt_lat, e.shape_pt_lon));
  }
  return result;
})();

const tripIdToShapeId: { [string] : string } = (() => {
  let result = {};
  for (let i = 0; i < tripsFile.length; i++) {
    result[tripsFile[i].trip_id] = tripsFile[i].shape_id;
  }
  return result;
})();

const routesNested: {[string]: Array<RouteJSON>} = d3.nest()
  .key(d => d.route_id)
  .object(routesFile);

type NestedTrip = {
  key: string,
  values: Array<TripJSON>
};

type NestedTripService = {
  key: string,
  values: Array<TripJSON>
};

type NestedTripsByService = {
  key: string,
  values: { [string]: Array<NestedTripService> }
};

const tripsNested: Array<NestedTripsByService> = (() => {
  // Nest by route_id
  const tripNest: Array<NestedTrip> = d3.nest()
    .key(d => d.route_id)
    .entries(tripsFile);

  const totalNest = tripNest.map(a => {
    // Nest by service_id
    const serviceNest: Array<NestedTrip> = d3.nest()
      .key(b => b.service_id)
      .entries(a.values);

    // Service ID is the key
    let serviceMap: { [string]: Array<NestedTripService> } = {};
    serviceNest.forEach(e => {
      serviceMap[e.key] = d3.nest().key(c => c.trip_id).entries(e.values);
    });

    return { key: a.key, values: serviceMap };
  });
  return totalNest;
})();

const stopTimesNested = d3.nest().key(d => d.trip_id).object(stopTimesFile);

// END - nesting data-structures

const stopFromStopJSON = (s: StopJSON) => {
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
  // Stop name -> route #s
  let stopsToRoutes: {[string]: Array<number>} = {};
  // Grab the index of the date we are getting stops for
  let dateIndex = calendarDatesFile.findIndex(d => d.date === serviceDate);
  // Grab the service ids for the current day plus one day
  let serviceIDs = calendarDatesFile
    .slice(dateIndex, dateIndex + 1)
    .map(d => '' + d.service_id);
  // Fill up the stopsToRoutes mapping with empty arrays
  stops.forEach(d => { stopsToRoutes[d.name] = []; });

  let buses: Array<Bus> = [];
  let postprocessBuses: Array<PostProcessBus> = [];
  for (let i = 0; i < tripsNested.length; i++) {
    const routeID = tripsNested[i].key;
    const routeNumber = routesNested[routeID][0].route_short_name;
    const serviceMap = tripsNested[i].values;

    let paths = [];
    let postprocessJourneys: Array<PostProcessJourney> = [];
    for (let j = 0; j < serviceIDs.length; j++) {
      // Grab tripIDs per serviceID
      const tripIDs = serviceMap[serviceIDs[j]];
      if (!tripIDs) continue;

      for (let k = 0; k < tripIDs.length; k++) {
        // Path per trip
        let timedStops: Array<TimedStop> = [];
        let tripID = tripIDs[k].key;
        let shapeID = tripIdToShapeId[tripID];
        let tripTimes = stopTimesNested[tripID];

        for (let l = 0; l < tripTimes.length; l++) {
          const stopID = tripTimes[l].stop_id;
          const isTimepoint = tripTimes[l].timepoint === 1;

          const optionalStopJSON: ?StopJSON =
            stopsFile.find(d => d.stop_id === stopID);

          if (!optionalStopJSON) throw new Error('Stop not found!');
          const stopJSON: StopJSON = optionalStopJSON;
          const stop = stopFromStopJSON(stopJSON);
          stopsToRoutes[stop.name].push(routeNumber);

          let time = 0;
          if (isTimepoint) {
            time = TimeUtils
              .stringTimeDayToWeekTime(tripTimes[l].arrival_time, j);
          }

          timedStops.push(new TimedStop(stop, time, isTimepoint));
          postprocessJourneys.push({stops: timedStops});
          const path = new Path(timedStops, shapesNested[shapeID]);
          paths.push(path);
        }
      }
    }

    postprocessBuses.push({journeys: postprocessJourneys});

    paths.sort((a: Path, b: Path) => {
      if (a.startTime() < b.startTime()) return -1;
      else if (a.startTime() > b.startTime()) return 1;
      return 0;
    });

    const bus = new Bus(paths, routeNumber);
    buses.push(bus);
  }

  // Mutate timedstops according to interpolation
  await GeoUtils.interpolateTimes(postprocessBuses, stops, nameToStopIndex);

  // Fill in this mapping, after we've created the buses themselves
  let result: {[number]: Bus} = {};
  buses.forEach(d => { result[d.lineNumber] = d; });

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
  nameToStopIndex,
  tripsNested
};
