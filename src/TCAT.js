// @flow
import fs from 'fs';
import Location from './models/Location';
import Stop from './models/Stop';

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

const buses = busesJSONs.map(json => {
  // TODO make bus
  return json;
});

export default {
  stops,
  buses
};
