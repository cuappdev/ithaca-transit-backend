// @flow
import Bus from './models/Bus';
import OSRM from './OSRM';
import Path from './models/Path';
import Location from './models/Location';
import Stop from './models/Stop';
import TCATUtils from './utils/TCATUtils';
import TimedStop from './models/TimedStop';

import fs from 'fs';

type RouteJSON = {
  name: string,
  location: Array<number>
};

type BusTableJSON = {
  times: Array<Array<string>>,
  bound: string,
  stops: Array<string>,
  days: Array<number>,
}

type BusJSON = {
  tables: Array<BusTableJSON>,
  number: number,
};

const stopsJSONs: Array<RouteJSON> = JSON.parse(
  fs.readFileSync(
    'data/stops.json',
    'utf8'
  )
);

const busesJSONs: Array<BusJSON> = JSON.parse(
  fs.readFileSync(
    'data/routes.json',
    'utf8'
  )
);

const stops = stopsJSONs.map(json => {
  const location = new Location(json.location[0], json.location[1]);
  return new Stop(json.name, location);
});

const nameToStop = (() => {
  let result = {};
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    result[stop.name] = stop;
  }
  return result;
})();

const buses = busesJSONs.map(json => {
  const paths = [].concat.apply([], json.tables.map(table => {
    const days = {
      start: table.days[0],
      end: table.days[1]
    };

    let paths = [];
    const times = table.times || [];
    for (let i = 0; i < times.length; i++) {
      let timedStops = [];
      for (let j = 0; j < times[i].length; j++) {
        const timeStr = times[i][j];
        // If this is the case, then the bus does not stop at this stop
        // at this time
        if (timeStr === '--' || timeStr === 'D') continue;

        const time = TCATUtils.stringTimeToSeconds(timeStr);
        const stop = nameToStop[table.stops[j]];
        timedStops.push(new TimedStop(stop, time));
      }
      const startTime = timedStops.length > 0
        ? timedStops[0].time
        : null;
      paths.push(new Path(days, timedStops, startTime));
    }
    return paths;
  }));
  return new Bus(paths, json.number);
});

const distanceMatrix: Promise<any> = (() => {
  const options = {
    coordinates: stops.map(s => {
      return [s.location.longitude, s.location.latitude];
    })
  };
  return OSRM.table(options);
})();

export default {
  stops,
  buses,
  distanceMatrix
};
