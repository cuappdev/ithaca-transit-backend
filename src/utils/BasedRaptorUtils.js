// @flow
import Location from '../models/Location';
import Stop from '../models/Stop';
import FootpathMatrix from '../models/FootpathMatrix';
import OSRM from '../OSRM';
import GTFS from '../GTFS';

const footpathMatrix = async (start: Stop, end: Stop): Promise<any> => {
  const allStops = [start, end].concat(GTFS.stops);
  const coordinates = allStops.map(stop => stop.location.toArray());
  const options = {coordinates: coordinates};
  const response = await OSRM.table(options);
  const durations = response.durations.map(a => a.map(b => b * 2));
  return new FootpathMatrix(allStops, durations);
};

export default {
  footpathMatrix
};
