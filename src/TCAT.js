// @flow
import Bus from './models/Bus';
import Path from './models/Path';
import Location from './models/Location';
import Kml from './models/Kml';
import Stop from './models/Stop';
import TCATUtils from './utils/TCATUtils';
import KmlUtils from './utils/KmlUtils';
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

type KmlJSON = {
  number: number,
  placemark: string
}

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

const kmlJSONs:  Array<KmlJSON> = JSON.parse(
  fs.readFileSync(
    'data/kml.json',
    'utf8'
  )
);

const stops = stopsJSONs.map(json => {
  const location = new Location(json.location[0], json.location[1]);
  return new Stop(json.name, location);
});

const nameToStop: Object = (() => {
  let result = {};
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    result[stop.name] = stop;
  }
  return result;
})();

const stopNameToIndex = (() => {
  let result = {};
  for (let i = 0; i < stops.length; i++) {
    result[stops[i].name] = i;
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

      paths.push(new Path(days, timedStops));
    }
    return paths;
  }));
  return new Bus(paths, json.number);
});

const busNumberToKml = (() => {
  let result = {};
  for (let i = 0; i < kmlJSONs.length; i++) {
    var placemark = kmlJSONs[i].placemark;
    result[kmlJSONs[i].number] = kmlJSONs[i];
    result[kmlJSONs[i].number].locations = KmlUtils.locationsFromPlacemark(placemark);
  }
  return result;
})();

export default {
  nameToStop,
  stops,
  stopNameToIndex,
  buses
};
