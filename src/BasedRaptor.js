// @flow
import Location from './models/Location';
import Stop from './models/Stop';
import Bus from './models/Bus';
import BusPath from './models/BusPath';
import Path from './models/Path';
import FootpathMatrix from './models/FootpathMatrix';
import GTFS from './GTFS';

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

  constructor (
    buses: {[number]: Bus},
    start: Stop,
    end: Stop,
    stopsToRoutes: {[string]: Array<number>},
    footpathMatrix: FootpathMatrix,
    startTime: number
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
    let Q = {};
    let marked = [];

    // preprocess
    for (let i = 0; i < GTFS.stops.length; i++) {
      let duration =
        this.footpathMatrix.durationBetween(this.start, GTFS.stops[i]);
      this.pathTable[GTFS.stops[i].name] = [{
        start: this.start,
        end: GTFS.stops[i],
        k: -1,
        startTime: this.startTime,
        endTime: this.startTime + duration,
        busPath: null
      }];
      marked.push(GTFS.stops[i]);
    }

    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < marked.length; i++) {
        let stop = marked[i];
        let routeNumbers = this.stopsToRoutes[stop];
        for (let j = 0; j < stop.length; j++) {
          let lastEndTime = this.pathTable[stop.name][0].endTime;
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

      let routeNumbers = Object.keys(Q);
      for (let i = 0; i < routeNumbers.length; i++) {
        let busPaths = Q[routeNumbers[i]];
        for (let j = 0; j < busPaths.length; j++) {
          let busPath = busPaths[j];
          for (let l = 0; l < busPath.length(); l++) {
            let timedStop = busPath.getStop(l);
            let stop = timedStop.stop;
            let endTime = this.pathTable[stop.name].endTime;
            if (endTime > timedStop.time) {
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

      for (let i = 0; i < marked.length; i++) {
        let stop = marked[i];
        let endTime = this._lastElement(stop).endTime;
        let durations = this.footpathMatrix.durationsToGTFSStops(stop);
        for (let j = 0; j < GTFS.stops.length; j++) {
          let otherStop = GTFS.stops[j];
          if (endTime + durations[j] < this._lastElement(otherStop)) {
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
  }
}

export default BasedRaptor;
