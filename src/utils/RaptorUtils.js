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

const walkingPaths = (
  start: Stop,
  end: Stop,
  startTime: number
): Promise<any> => {
  const coordinates = [
    start.location.toArray(),
    end.location.toArray()
  ].concat(TCAT.stops.map(stop => stop.location.toArray()));

  const options = {coordinates: coordinates};
  return OSRM.table(options).then(response => {
    const durations = response.durations.map(a => a.map(b => b * 1000));
    let raptorPaths = [];
    const day = dayFromTimeInSecs(startTime);
    const tcatNum = TCATConstants.WALKING_TCAT_NUMBER;

    for (let i = 0; i < TCAT.stops.length; i++) {
      // From Start
      const fromStartTravelTime = durations[0][i + 2];
      const fromStartTimedStops = [
        new TimedStop(start, startTime),
        new TimedStop(TCAT.stops[i], startTime + fromStartTravelTime)
      ];
      raptorPaths.push(new RaptorPath(day, tcatNum, fromStartTimedStops));

      // To End
      const toEndTravelTime = durations[i + 2][1];
      const toEndTimedStops = [
        new TimedStop(TCAT.stops[i], TCATConstants.BASE_END_TIME),
        new TimedStop(end, TCATConstants.BASE_END_TIME + toEndTravelTime)
      ];
      raptorPaths.push(new RaptorPath(day, tcatNum, toEndTimedStops));
    }

    // Route that features walking from start to end
    const startToEndTime = durations[0][1];
    const startToEndTimedStops = [
      new TimedStop(start, TCATConstants.BASE_END_TIME),
      new TimedStop(end, TCATConstants.BASE_END_TIME + startToEndTime)
    ];
    raptorPaths.push(new RaptorPath(day, tcatNum, startToEndTimedStops));

    return Promise.resolve(raptorPaths);
  });
};

export default {
  dayFromTimeInSecs,
  generateRaptorPaths,
  walkingPaths
};
