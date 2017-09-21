// @flow
import Bus from '../models/Bus';
import Location from '../models/Location';
import Path from '../models/Path';
import Stop from '../models/Stop';
import TimedStop from '../models/TimedStop';

type StopMetadata = {
  name: string,
  lat: number,
  long: number
};

type TimedStopMetadata = {
  stopIndex: number,
  time: number
};

type BusMetadata = {
  lineNumber: number,
  paths: Array<Array<TimedStopMetadata>>
};

type TestCase = {
  stops: Array<StopMetadata>,
  buses: Array<BusMetadata>
};

type RaptorInput = {
  buses: {[number]: Bus},
  stopsToRoutes: {[string]: Array<number>},
  stops: Array<Stop>
};

const generateDataStructures = (testCase: TestCase): RaptorInput => {
  // Stops
  const stops = testCase.stops.map((s: StopMetadata) => {
    return new Stop(s.name, new Location(s.lat, s.long));
  });

  // Instantiate mapping
  let stopsToRoutes: {[string]: Array<number>} = {};
  stops.forEach(d => { stopsToRoutes[d.name] = []; });

  // Buses + build up stopsToRoutes
  const buses: Array<Bus> = testCase.buses.map((b: BusMetadata) => {
    const paths = b.paths.map((pArr: Array<TimedStopMetadata>) => {
      const timedStops: Array<TimedStop> = pArr.map((ts: TimedStopMetadata) => {
        // Add to data structure
        stopsToRoutes[stops[ts.stopIndex].name].push(b.lineNumber);
        // Return timedStop
        return new TimedStop(stops[ts.stopIndex], ts.time, true);
      });
      return new Path(timedStops);
    });
    return new Bus(paths, b.lineNumber);
  });

  // Mappings
  let busMapping: {[number]: Bus} = {};
  buses.forEach(b => { busMapping[b.lineNumber] = b; });
  // Remove duplicates
  stops.forEach(d => {
    let seen = {};
    stopsToRoutes[d.name] = stopsToRoutes[d.name].filter(e => {
      return seen.hasOwnProperty(e) ? false : (seen[e] = true);
    });
  });

  return {
    buses: busMapping,
    stopsToRoutes: stopsToRoutes,
    stops: stops
  };
};

export default {
  generateDataStructures
};
