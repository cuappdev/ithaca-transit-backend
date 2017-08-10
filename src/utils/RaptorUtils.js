// @flow
import RaptorPath from '../models/RaptorPath';
import TCAT from '../TCAT';
import TCATConstants from './TCATConstants';

const generateRaptorPaths = (startTime: number): Array<RaptorPath> => {
  const currentDay = ~~(startTime / TCATConstants.DAY); // classic int division

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
          raptorPaths.push(new RaptorPath(path, day, bus.lineNumber));
        }
      }
    }
  }

  return raptorPaths;
};

export default {
  generateRaptorPaths
};
