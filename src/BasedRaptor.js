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

  // Grab the last, viable path element for a particular
  // stop, based on the current pathTable and the current
  // round
  _lastElement (
    pathTable: {[string]: Array<?PathElement>},
    stop: Stop,
    currK: number
  ): PathElement {
    let pathElements = pathTable[stop.name];
    let i = currK;
    while (i >= 0) {
      if (pathElements[i]) return pathElements[i];
      i--;
    }
    throw Error('We found no viable path element!');
  }

  // Build up a path table according to our round
  // number constraint
  _initPathTable (): {[string]: Array<?PathElement>} {
    let pathTable: {[string]: Array<?PathElement>} = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      pathTable[stop.name] = [];
      for (let j = 0; j < TCATConstants.MAX_RAPTOR_ROUNDS + 1; j++) {
        pathTable[stop.name].push(null);
      }
    }
    return pathTable;
  }

  run () {
    // Route Number -> [BusPath]
    let Q: Array<BusPath>;
    let marked = [];
    let pathTable = this._initPathTable();

    // Preprocess + skip a step
    for (let i = 0; i < this.stops.length; i++) {
      let duration =
        this.footpathMatrix.durationBetween(this.start, this.stops[i]);
      pathTable[this.stops[i].name][0] = {
        start: this.start,
        end: this.stops[i],
        k: -1,
        startTime: this.startTime,
        endTime: this.startTime + duration,
        busPath: null
      };
      marked.push(this.stops[i]);
    }

    // Start looping over rounds
    for (let k = 1; k < TCATConstants.MAX_RAPTOR_ROUNDS + 1; k++) {
      // Accumulate routes serving marked stops from previous round
      Q = []; // clear that queue
      // For each marked stop...
      for (let i = 0; i < marked.length; i++) {
        const stop = marked[i];
        const routeNumbers = this.stopsToRoutes[stop.name];
        // For each route # serving marked stop `stop`....
        for (let j = 0; j < routeNumbers.length; j++) {
          // Clear out all stops that come after `stop` in
          // route `routeNum` that are in `Q`
          const routeNum = routeNumbers[j];
          const lastEndTime: number =
            this._lastElement(pathTable, stop, k).endTime;
          // If this route number is contained `Q`
          let bus = this.buses[routeNum];
          // Grabs the buspaths related to this stop -> traverse them later
          let busPath = bus.earliestTripForward(stop, lastEndTime);
          if (busPath) Q.push(busPath);
        }
      }
      // Clear marked :D
      marked.length = 0;
      // Go through the lines with queued bus paths and try and improve
      // times to get to each stop from the original start stop
      for (let j = 0; j < Q.length; j++) {
        let busPath = Q[j];
        for (let l = 0; l < busPath.length(); l++) {
          const timedStop = busPath.getStop(l);
          const stop = timedStop.stop;
          const endTime: number =
            this._lastElement(pathTable, stop, k).endTime;
          // Only re-mark / update if this will benefit us in terms
          // of getting to the final stop
          if (endTime > timedStop.time) {
            pathTable[stop.name][k] = {
              start: busPath.cutoff,
              end: timedStop.stop,
              k: k,
              startTime: busPath.getStop(0).time,
              endTime: timedStop.time,
              busPath: busPath
            };
            marked.push(stop);
          }
        }
      }

      // Process foot-paths
      for (let i = 0; i < marked.length; i++) {
        let stop = marked[i];
        let endTime = this._lastElement(pathTable, stop, k).endTime;
        let durations = this.footpathMatrix.durationsToGTFSStops(stop);
        for (let j = 0; j < this.stops.length; j++) {
          let otherStop = this.stops[j];
          if (
            endTime + durations[j] <
            this._lastElement(pathTable, otherStop, k).endTime
          ) {
            pathTable[otherStop.name][k] = {
              start: stop,
              end: otherStop,
              k: k,
              startTime: endTime,
              endTime: endTime + durations[j],
              busPath: null
            };
          }
        }
      }
    }

    // Establish end times
    const endFinishTimes = this.stops.map((stop: Stop) => {
      const lastEndTime: number = this
        ._lastElement(pathTable, stop, TCATConstants.MAX_RAPTOR_ROUNDS)
        .endTime;
      const walkTime = this.footpathMatrix.durationBetween(stop, this.end);
      return { stop: stop, endTime: lastEndTime + walkTime };
    });

    // Sorted based on the best end time
    const sortedEndFinishTimes = [{
      stop: this.start,
      endTime: this.startTime +
        this.footpathMatrix.durationBetween(this.start, this.end)
    }].concat(endFinishTimes).sort((a: Object, b: Object) => {
      return (a.endTime < b.endTime)
        ? -1
        : (a.endTime > b.endTime ? 1 : 0);
    });

    // Backtrack
    let results = [];
    for (let i = 0; i < Math.min(5, sortedEndFinishTimes.length); i++) {
      if (sortedEndFinishTimes[i].stop.equals(this.start)) {
        results.push({
          arrivalTime: sortedEndFinishTimes[i].endTime,
          path: 'Walk the entire way'
        });
      } else {
        // Backtrack
        const lastElement = this._lastElement(
          pathTable,
          sortedEndFinishTimes[i].stop,
          TCATConstants.MAX_RAPTOR_ROUNDS
        );
        let currentElement = lastElement;
        let topOrder: Array<PathElement> = [lastElement];
        while (currentElement.k >= 0) {
          currentElement = this._lastElement(
            pathTable,
            currentElement.start,
            currentElement.k
          );
          topOrder.push(currentElement);
        }
        results.push({
          arrivalTime: sortedEndFinishTimes[i].endTime,
          path: topOrder.reverse()
        });
      }
    }

    return results;
  }
}

export default BasedRaptor;
