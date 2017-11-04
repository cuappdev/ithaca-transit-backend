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
  pathTable: {[string]: Array<?PathElement>};

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
    this.pathTable = this._initPathTable();
  }

  // Build up a path table according to our round
  // number constraint
  _initPathTable (): {[string]: Array<?PathElement>} {
    let table: {[string]: Array<?PathElement>} = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      table[stop.name] = [];
      for (let j = 0; j < TCATConstants.MAX_RAPTOR_ROUNDS + 1; j++) {
        table[stop.name].push(null);
      }
    }
    return table;
  }

  // Grab the last, viable path element for a particular
  // stop, based on the current pathTable and the current
  // round
  _getLastElement (stop: Stop, k: number): PathElement {
    let pathElements = this.pathTable[stop.name];
    while (k >= 0) {
      if (pathElements[k]) return pathElements[k];
      k--;
    }
    throw Error('We found no viable path element!');
  }

  // Preprocess + skip a step
  _preprocessAndFilleMarked (marked: Array<Stop>) {
    for (let i = 0; i < this.stops.length; i++) {
      let duration =
        this.footpathMatrix.durationBetween(this.start, this.stops[i]);
      this.pathTable[this.stops[i].name][0] = {
        start: this.start,
        end: this.stops[i],
        k: 0,
        startTime: this.startTime,
        endTime: this.startTime + duration,
        busPath: null
      };
      marked.push(this.stops[i]);
    }
  }

  // Accumulate routes serving marked stops from previous round
  _processMarked (k: number, marked: Array<Stop>, Q: Array<BusPath>) {
    // For each marked stop...
    for (let i = 0; i < marked.length; i++) {
      const stop = marked[i];
      const routeNumbers = this.stopsToRoutes[stop.name];
      // For each route # serving marked stop `stop`....
      for (let j = 0; j < routeNumbers.length; j++) {
        // Clear out all stops that come after `stop` in
        // route `routeNum` that are in `Q`
        const routeNum = routeNumbers[j];
        const lastEndTime: number =this._getLastElement(stop, k).endTime;
        // If this route number is contained `Q`
        let bus = this.buses[routeNum];
        // Grabs the buspaths related to this stop -> traverse them later
        let busPath = bus.earliestTripForward(stop, lastEndTime);
        if (busPath) Q.push(busPath);
      }
    }
  }

  _processBusPaths (k: number, marked: Array<Stop>, Q: Array<BusPath>) {
    // Go through the lines with queued bus paths and try and improve
    // times to get to each stop from the original start stop
    for (let j = 0; j < Q.length; j++) {
      let busPath = Q[j];
      for (let l = 0; l < busPath.length(); l++) {
        const timedStop = busPath.getStop(l);
        const stop = timedStop.stop;
        const endTime: number = this._getLastElement(stop, k).endTime;
        // Only re-mark / update if this will benefit us in terms
        // of getting to the final stop
        if (endTime > timedStop.time) {
          this.pathTable[stop.name][k] = {
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
  }

  // Process foot-paths
  _processFootpaths (k: number, marked: Array<Stop>) {
    for (let i = 0; i < marked.length; i++) {
      let stop = marked[i];
      let endTime = this._getLastElement(stop, k).endTime;
      let durations = this.footpathMatrix.durationsToGTFSStops(stop);
      for (let j = 0; j < this.stops.length; j++) {
        let otherStop = this.stops[j];
        if (otherStop.name === stop.name) {
          continue;
        }

        if (endTime + durations[j] < this._getLastElement(otherStop, k).endTime) {
          this.pathTable[otherStop.name][k] = {
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

  // Backtrack and prune joruneys
  _backtrackAndPrune (): Array<Array<PathElement>> {
    let journeys: Array<Array<PathElement>> = [];
    console.log(journeys);
    for (let i = 0; i < this.stops.length; i++) {
      let journey: Array<PathElement> = [];
      let stop = this.stops[i];
      let k = TCATConstants.MAX_RAPTOR_ROUNDS;
      let isOnlyWalking = true;

      while (k >= 0 && stop) {
        let element = this._getLastElement(stop, k);
        journey.push(element);
        stop = element.start;
        k = element.k - 1;
        isOnlyWalking = isOnlyWalking && element.busPath == null;
      }
      if (k < 0 && !isOnlyWalking) {
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

    return journeys;
  }

  _prioritizeJourneys (journeys: Array<Array<PathElement>>) {
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
    });
  }

  run (): Array<RaptorResponseElement> {
    // Route Number -> [BusPath]
    let Q: Array<BusPath> = [];
    let marked = [];
    this._preprocessAndFilleMarked(marked);

    // Start looping over rounds
    for (let k = 1; k < TCATConstants.MAX_RAPTOR_ROUNDS + 1; k++) {
      Q.length = 0; // clear that queue

      this._processMarked(k, marked, Q);

      // Clear marked :D
      marked.length = 0;

      this._processBusPaths(k, marked, Q);
      this._processFootpaths(k, marked);
    }
    let journeys: Array<Array<PathElement>> = this._backtrackAndPrune();

    this._prioritizeJourneys(journeys);

    journeys = journeys.slice(0, Math.min(journeys.length, 15) + 1);

    journeys.push([{
      start: this.start,
      end: this.end,
      k: TCATConstants.MAX_RAPTOR_ROUNDS + 1,
      startTime: this.startTime,
      endTime: this.startTime + this.footpathMatrix.durationBetween(this.start, this.end),
      busPath: null
    }]);

    let response = journeys.map(d => {
        return {
          arrivalTime: d[d.length-1].endTime,
          path: d
        };
    });

    return response;
  }
}

export default BasedRaptor;
