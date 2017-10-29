// @flow
import { Stop, Bus, BusPath, FootpathMatrix } from './models';
import TCATConstants from './utils/TCATConstants';

// Element in a returned Raptor path
type PathElement = {
  start: Stop,
  end: Stop,
  k: number,
  startTime: number,
  endTime: number,
  busPath: ?BusPath,
};

// Element used in scoring the different last stops
// in paths
type StopScoreElement = {
  stop: Stop,
  endTime: number
};

// Raptor returns an array of these
type RaptorResponseElement = {
  arrivalTime: number,
  path: Array<PathElement>
};

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

  // Grab the last, viable path element for a particular
  // stop, based on the current pathTable and the current
  // round
  _getLastElement (
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

  // Sorted list score elements, driven by the most efficient
  // way to get to each stop [start + all other stops]
  _getSortedEndFinishTimes (
    pathTable: {[string]: Array<?PathElement>}
  ): Array<StopScoreElement> {
    const endFinishTimes = this.stops.map((stop: Stop) => {
      const lastEndTime: number = this
        ._getLastElement(pathTable, stop, TCATConstants.MAX_RAPTOR_ROUNDS)
        .endTime;
      const walkTime = this.footpathMatrix.durationBetween(stop, this.end);
      return { stop: stop, endTime: lastEndTime + walkTime };
    });

    const directWalkingScore: StopScoreElement = {
      stop: this.start,
      endTime: this.startTime +
        this.footpathMatrix.durationBetween(this.start, this.end)
    };

    return [directWalkingScore]
      .concat(endFinishTimes).sort((a: Object, b: Object) => {
        return (a.endTime < b.endTime)
          ? -1
          : (a.endTime > b.endTime ? 1 : 0);
      });
  }

  run (): Array<RaptorResponseElement> {
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
        k: 0,
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
            this._getLastElement(pathTable, stop, k).endTime;
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
            this._getLastElement(pathTable, stop, k).endTime;
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
        let endTime = this._getLastElement(pathTable, stop, k).endTime;
        let durations = this.footpathMatrix.durationsToGTFSStops(stop);
        for (let j = 0; j < this.stops.length; j++) {
          let otherStop = this.stops[j];
          if (otherStop.name === stop.name) {
            continue;
          }
          if (
            endTime + durations[j] <
            this._getLastElement(pathTable, otherStop, k).endTime
          ) {
            pathTable[otherStop.name][k] = {
              start: stop,
              end: otherStop,
              k: k,
              startTime: endTime,
              endTime: endTime + durations[j],
              busPath: null
            };
            marked.push(otherStop);
          }
        }
      }
    }

    // Backpack
    let journeys: Array<Array<PathElement>> = [];
    for (let i = 0; i < this.stops.length; i++) {
      let journey: Array<PathElement> = [];
      let stop = this.stops[i];
      let k = TCATConstants.MAX_RAPTOR_ROUNDS;
      while (k >= 0 && stop) {
        let element = this._getLastElement(
          pathTable,
          stop,
          k
        );
        journey.push(element);
        stop = element.start;
        k = element.k - 1;
      }
      if (k < 0) {
        journey.reverse();
        let lastElement = journey[journey.length-1];
        let finalElement = {
          start: lastElement.end,
          end: this.end,
          k: TCATConstants.MAX_RAPTOR_ROUNDS + 1,
          startTime: lastElement.endTime,
          endTime: lastElement.endTime + this.footpathMatrix.durationBetween(lastElement.end, this.end),
          busPath: null
        };
        journey.push(finalElement);
        journeys.push(journey);
      }
    }

    journeys = journeys.filter(a => {
      return !a.reduce((acc, x) => acc && (x.busPath == null), true);
    });

    journeys.push([{
      start: this.start,
      end: this.end,
      k: TCATConstants.MAX_RAPTOR_ROUNDS + 1,
      startTime: this.startTime,
      endTime: this.startTime + this.footpathMatrix.durationBetween(this.start, this.end),
      busPath: null
    }]);

    journeys.sort((a, b) => {
      let aTime = a[a.length-1].endTime;
      let bTime = b[b.length-1].endTime;
      if (aTime < bTime) { return -1; }
      if (aTime > bTime) { return 1; }

      let aWalkTime = 0;
      let bWalkTime = 0;
      for (let i = 0; i < a.length; i++) {
        aWalkTime += a[i].busPath ? a[i].endTime - a[i].startTime : 0;
      }
      for (let i = 0; i < b.length; i++) {
        bWalkTime += b[i].busPath ? b[i].endTime - b[i].startTime : 0;
      }
      if (aWalkTime < bWalkTime) { return -1; }
      if (aWalkTime > bWalkTime) { return 1; }

      return 0;
    })

/*
    // Sorted based on the best end time
    const sortedEndFinishTimes = this._getSortedEndFinishTimes(pathTable);

    // Backtrack
    let results: Array<RaptorResponseElement> = [];
    for (let i = 0; i < Math.min(5, sortedEndFinishTimes.length); i++) {
      if (sortedEndFinishTimes[i].stop.equals(this.start)) {
        results.push({
          arrivalTime: sortedEndFinishTimes[i].endTime,
          path: [{
            start: this.start,
            end: this.end,
            k: 0,
            startTime: this.startTime,
            endTime: sortedEndFinishTimes[i].endTime,
            busPath: null
          }]
        });
      } else {
        // Backtrack
        const lastElement = this._getLastElement(
          pathTable,
          sortedEndFinishTimes[i].stop,
          TCATConstants.MAX_RAPTOR_ROUNDS
        );
        let currentElement = lastElement;
        let topOrder: Array<PathElement> = [lastElement];
        while (currentElement.k >= 0) {
          currentElement = this._getLastElement(
            pathTable,
            currentElement.start,
            currentElement.k - 1
          );
          topOrder.push(currentElement);
        }
        results.push({
          arrivalTime: sortedEndFinishTimes[i].endTime,
          path: topOrder.reverse()
        });
      }
    }
*/
    return journeys;
  }
}

export default BasedRaptor;
