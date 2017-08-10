// @flow
import OSRM from '../OSRM';
import RaptorPath from '../models/RaptorPath';
import Stop from '../models/Stop';
import TCAT from '../TCAT';
import TCATConstants from './TCATConstants';
import TimedStop from '../models/TimedStop';

const dayFromTimeInSecs = (timeInSecs: number): number => {
  return ~~(timeInSecs / TCATConstants.DAY); // classic int division
};

const generateRaptorPaths = (startTime: number): Array<RaptorPath> => {
  const currentDay = dayFromTimeInSecs(startTime);

  let raptorPaths = [];
  for (
    let day = currentDay;
    day < currentDay + TCATConstants.RAPTOR_PROJECTED_DAYS;
    day++
  ) {
    for (let i = 0; i < TCAT.buses.length; i++) {
      const bus = TCAT.buses[i];
      for (let j = 0; j < bus.paths.length; j++) {
        const path = bus.paths[j];
        const dayModded = day % 7;
        if (path.runsOnDay(dayModded)) {
          raptorPaths.push(RaptorPath.fromPath(path, day, bus.lineNumber));
        }
      }
    }
  }
  return raptorPaths;
};

const walkingPaths = (start: Stop, end: Stop, startTime: number) => {
  const coordinates = [
    start.location.toArray(),
    end.location.toArray()
  ].concat(TCAT.stops.map(stop => stop.location.toArray()));

  const options = {coordinates: coordinates};
  return OSRM.table(options).then(response => {
    const {durations} = response;
    let raptorPaths = [];
    for (let i = 0; i < TCAT.stops.length; i++) {
      const travelTime = durations[0][i + 2];

      const day = dayFromTimeInSecs(startTime);
      const tcatNum = TCATConstants.WALKING_TCAT_NUMBER;
      const timedStops = [
        new TimedStop(start, startTime),
        new TimedStop(TCAT.stops[i], startTime + travelTime)
      ];

      raptorPaths.push(new RaptorPath(day, tcatNum, timedStops));
    }

    // TODO, stop-oriented ones
    return Promise.resolve(raptorPaths);
  });
};

export default {
  dayFromTimeInSecs,
  generateRaptorPaths,
  walkingPaths
};
