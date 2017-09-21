// @flow
import BasedRaptor from '../BasedRaptor';
import Bus from '../models/Bus';
import FootpathMatrix from '../models/FootpathMatrix';
import Location from '../models/Location';
import Path from '../models/Path';
import Stop from '../models/Stop';
import TimedStop from '../models/TimedStop';

import fs from 'fs';

type StopMetadata = {
  name: string
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
  buses: Array<BusMetadata>,
  startTime: number,
  routingMatrix: Array<Array<number>>
};

type RaptorInput = {
  start: Stop,
  end: Stop,
  buses: {[number]: Bus},
  stopsToRoutes: {[string]: Array<number>},
  stops: Array<Stop>,
  startTime: number,
  footpathMatrix: FootpathMatrix
};

const generateDataStructures = (testCase: TestCase): RaptorInput => {
  // Stops
  const start = new Stop('Start', new Location(-1, -1));
  const end = new Stop('End', new Location(-1, -1));
  const startTime = testCase.startTime;
  const stops = testCase.stops.map((s: StopMetadata) => {
    return new Stop(s.name, new Location(-1, -1));
  });

  const footpathMatrix = new FootpathMatrix(
    [start, end].concat(stops),
    testCase.routingMatrix
  );

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
    start: start,
    end: end,
    buses: busMapping,
    stopsToRoutes: stopsToRoutes,
    stops: stops,
    startTime: startTime,
    footpathMatrix: footpathMatrix
  };
};

const raptorInstanceGenerator = async (path: string): Promise<BasedRaptor> => {
  const testJson = JSON.parse(fs.readFileSync(path, 'utf8'));
  const raptorInput = generateDataStructures(testJson);
  return new BasedRaptor(
    raptorInput.buses,
    raptorInput.start,
    raptorInput.end,
    raptorInput.stopsToRoutes,
    raptorInput.footpathMatrix,
    raptorInput.startTime,
    raptorInput.stops
  );
};

export default {
  generateDataStructures,
  raptorInstanceGenerator
};
