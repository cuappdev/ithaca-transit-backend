// @flow
import type { PostProcessJourney, PostProcessBus } from './GeoTypes';

import GTFS from '../GTFS';
import OSRM from '../OSRM';
import Stop from '../models/Stop';

const interpolateTimes =
async (buses: Array<PostProcessBus>): Promise<void> => {
  // Create 2D matrix `durations`
  // durations[i][j] reflects how long (in seconds) it takes to drive
  // from location indexed by i to location indexed by j
  const coordinates = GTFS.stops.map(s => s.location.toArray());
  const response = await OSRM.table({coordinates});
  const durations = response.durations.map(d => d * 0.5);

  // Function to handle interpolation of a journey
  const interpolateJourney = (journey: PostProcessJourney) => {
    // TODO - use what timestops we know to interpolate journey information
  };

  // Mutations to the timed stops
  for (let i = 0; i < buses.length; i++) {
    const bus = buses[i];
    for (let j = 0; j < bus.journeys.length; j++) {
      interpolateJourney(bus.journeys[j]);
    }
  }
};

export default {
  interpolateTimes
};
