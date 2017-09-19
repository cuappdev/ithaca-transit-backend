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
  pathTable: {[string]: Array<PathElement>};
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
    this.pathTable = {};
  }

  _lastElement (stop: Stop): PathElement {
    let pathElements = this.pathTable[stop.name];
    let length = pathElements.length;
    return pathElements[length - 1];
  }

  run () {
    let Q: {[number]: Array<BusPath>} = {};
    let marked = [];

    // Preprocess
    for (let i = 0; i < this.stops.length; i++) {
      let duration =
        this.footpathMatrix.durationBetween(this.start, this.stops[i]);
      this.pathTable[this.stops[i].name] = [{
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
      // Grabbing values that have yet to be marked ->
      // to get bus paths that pass through the given stop
      // for each route that it's apart of
      for (let i = 0; i < marked.length; i++) {
        const stop = marked[i];
        const routeNumbers = this.stopsToRoutes[stop];
        // For each route the stop is apart of, add possible bus paths
        for (let j = 0; j < routeNumbers.length; j++) {
          let lastEndTime = this.pathTable[stop.name][k].endTime;
          if (this.pathTable.hasOwnProperty(stop.name)) {
            let busPaths = Q[routeNumbers[j]];
            let wasChange = false;
            for (let l = 0; l < busPaths.length; l++) {
              let busPath = busPaths[l];
              if (busPath.comesBeforeStartAfterTime(stop, lastEndTime)) {
                busPath.cutoff = stop;
                wasChange = true;
                break;
              }
            }
            if (!wasChange) {
              let bus = this.buses[routeNumbers[j]];
              let busPath = bus.earliestTripForward(stop, lastEndTime);
              Q[routeNumbers[j]].push(busPath);
            }
          } else {
            let bus = this.buses[routeNumbers[j]];
            let busPath = bus.earliestTripForward(stop, lastEndTime);
            Q[routeNumbers[j]] = [busPath];
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
            let endTime = this.pathTable[stop.name].endTime;
            if (endTime > timedStop.time) {
              this.pathTable[stop.name].length =
                Math.min(k + 1, this.pathTable[stop.name].length);
              this.pathTable[stop.name].push({
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
        let endTime = this._lastElement(stop).endTime;
        let durations = this.footpathMatrix.durationsToGTFSStops(stop);
        for (let j = 0; j < this.stops.length; j++) {
          let otherStop = this.stops[j];
          if (endTime + durations[j] < this._lastElement(otherStop)) {
            // Effectively eliminates extra elements, fixing the correspondence
            // for backpointers
            this.pathTable[otherStop.name].length =
              Math.min(k + 1, this.pathTable[otherStop.name].length);
            this.pathTable[otherStop.name].push({
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

    // TODO - backtrack
  }
}

export default BasedRaptor;
