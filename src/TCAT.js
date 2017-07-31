// @flow
import fs from 'fs';
import Location from './models/Location';
import Stop from './models/Stop';

type RouteJSON = {
  name: string,
  location: Array<number>
};

// Grab stops JSON
const stopsJSONs: Array<RouteJSON> =
  JSON.parse(fs.readFileSync('data/stops.json', 'utf8'));

const stops = stopsJSONs.map(json => {
  const location = new Location(json.location[0], json.location[1]);
  return new Stop(json.name, location);
});

export default {
  stops
};
