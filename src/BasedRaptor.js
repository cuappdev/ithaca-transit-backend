// @flow
import Stop from './models/Stop';
import Bus from './models/Bus';
import BusPath from './models/BusPath';
import FootpathMatrix from './models/FootpathMatrix';
import TCATConstants from './utils/TCATConstants';

type PathElement = {
  start: Stop,
  end: Stop,
  k: number,
  startTime: number,
  endTime: number,
  busPath: ?BusPath,
}

class BasedRaptor {
  buses: {[number]: Bus};
  start: Stop;
  end: Stop;
  stopsToRoutes: {[string]: Array<number>};
  footpathMatrix: FootpathMatrix;
  startTime: number;
  stops: Array<Stop>;

  constructor (
    buses: {[number]: Bus},
    start: Stop,
    end: Stop,
    stopsToRoutes: {[string]: Array<number>},
    footpathMatrix: FootpathMatrix,
    startTime: number,
    stops: Array<Stop>
  ) {
    this.buses = buses;
    this.start = start;
    this.end = end;
    this.stopsToRoutes = stopsToRoutes;
    this.footpathMatrix = footpathMatrix;
    this.startTime = startTime;
    this.stops = stops;
  }

  _lastElement (
    pathTable: {[string]: Array<PathElement>},
    stop: Stop
  ): PathElement {
    let pathElements = pathTable[stop.name];
    let length = pathElements.length;
    return pathElements[length - 1];
  }

  run () {
    // Route Number -> [BusPath]
    let Q: {[number]: Array<BusPath>} = {};
    let marked = [];
    let pathTable: {[string]: Array<PathElement>} = {};

    // Preprocess
    for (let i = 0; i < this.stops.length; i++) {
      let duration =
        this.footpathMatrix.durationBetween(this.start, this.stops[i]);
      pathTable[this.stops[i].name] = [{
        start: this.start,
        end: this.stops[i],
        k: -1,
        startTime: this.startTime,
        endTime: this.startTime + duration,
        busPath: null
      }];
      marked.push(this.stops[i]);
    }

    // Start looping over rounds
    for (let k = 0; k < TCATConstants.MAX_RAPTOR_ROUNDS; k++) {
      // Accumulate routes serving marked stops from previous round
      Q = {}; // Clear queue
      // For each marked stop...
      for (let i = 0; i < marked.length; i++) {
        const stop = marked[i];
        const routeNumbers = this.stopsToRoutes[stop.name];
        // For each route # serving marked stop `stop`....
        for (let j = 0; j < routeNumbers.length; j++) {
          // Clear out all stops that come after `stop` in
          // route `routeNum` that are in `Q`
          const routeNum = routeNumbers[j];
          const lastEndTime = pathTable[stop.name][k].endTime;
          // If this route number is contained `Q`
          if (Q.hasOwnProperty(routeNum)) {
            let busPaths = Q[routeNum];
            let wasChange = false;
            // TODO - comment this more
            for (let l = 0; l < busPaths.length; l++) {
              let busPath = busPaths[l];
              if (busPath.comesBeforeStartAfterTime(stop, lastEndTime)) {
                busPath.cutoff = stop;
                wasChange = true;
                break;
              }
            }
            if (!wasChange) {
              let bus = this.buses[routeNum];
              let busPath = bus.earliestTripForward(stop, lastEndTime);
              if (busPath) {
                Q[routeNum].push(busPath);
              }
            }
          } else {
            let bus = this.buses[routeNum];
            let busPath = bus.earliestTripForward(stop, lastEndTime);
            if (busPath) {
              Q[routeNum] = [busPath];
            }
          }
        }
      }

      marked.length = 0;

      let queuedRoutes = Object.keys(Q);
      // Go through the lines with queued bus paths and try and improve
      // times to get to each stop from the original start stop
      for (let i = 0; i < queuedRoutes.length; i++) {
        let busPaths = Q[queuedRoutes[i]];
        for (let j = 0; j < busPaths.length; j++) {
          let busPath = busPaths[j];
          for (let l = 0; l < busPath.length(); l++) {
            let timedStop = busPath.getStop(l);
            let stop = timedStop.stop;
            // TODO - is this right?
            let endTime = pathTable[stop.name][pathTable[stop.name].length - 1].endTime;
            if (endTime > timedStop.time) {
              pathTable[stop.name].length =
                Math.min(k + 1, pathTable[stop.name].length);
              pathTable[stop.name].push({
                start: busPath.cutoff,
                end: timedStop.stop,
                k: k,
                startTime: busPath.getStop(0).time,
                endTime: timedStop.endTime,
                busPath: busPath
              });
              marked.push(stop);
            }
          }
        }
      }

      // Process foot-paths
      for (let i = 0; i < marked.length; i++) {
        let stop = marked[i];
        let endTime = this._lastElement(pathTable, stop).endTime;
        let durations = this.footpathMatrix.durationsToGTFSStops(stop);
        for (let j = 0; j < this.stops.length; j++) {
          let otherStop = this.stops[j];
          if (
            endTime + durations[j] <
            this._lastElement(pathTable, otherStop).endTime
          ) {
            // Effectively eliminates extra elements, fixing the correspondence
            // for backpointers
            pathTable[otherStop.name].length =
              Math.min(k + 1, pathTable[otherStop.name].length);
            pathTable[otherStop.name].push({
              start: stop,
              end: otherStop,
              k: k,
              startTime: endTime,
              endTime: endTime + durations[j],
              busPath: null
            });
          }
        }
      }
    }

    console.log(pathTable);
    // TODO - backtrack
    return pathTable[this.end.name];
  }
}

export default BasedRaptor;
