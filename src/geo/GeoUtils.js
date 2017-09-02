// @flow
import type { PostProcessBus } from './GeoTypes';

import OSRM from '../OSRM';
import Stop from '../models/Stop';

const interpolateTimes = async (
  stops: Array<Stop>,
  buses: Array<PostProcessBus>
): Promise<void> => {
  // Create 2D matrix `durations`
  // durations[i][j] reflects how long (in seconds) it takes to drive
  // from location indexed by i to location indexed by j
  const coordinates = stops.map(s => s.location.toArray());
  const response = await OSRM.table({coordinates});
  const durations = response.durations.map(d => d * 0.5);

  // TODO - apply this to the TimedStops in journeys of buses
};

export default {
  interpolateTimes
};
