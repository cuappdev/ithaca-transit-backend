// @flow
import { Stop, FootpathMatrix } from '../models';
import OSRM from '../OSRM';
import GTFS from '../GTFS';

const footpathMatrix = async (start: Stop, end: Stop): Promise<any> => {
  const allStops = [start, end].concat(GTFS.stops);
  const coordinates = allStops.map(stop => stop.location.toArray());
  const options = {coordinates: coordinates};
  const response = await OSRM.footTable(options);
  const durations = response.durations.map(a => a.map(b => b * 2));
  return new FootpathMatrix(allStops, durations);
};

export default {
  footpathMatrix
};