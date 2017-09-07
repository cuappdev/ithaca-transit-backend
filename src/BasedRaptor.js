// @flow
import Location from './models/Location';
import Stop from './models/Stop';
import Bus from './models/Bus';
import BusPath from './models/BusPath';
import Path from './models/Path';
import FootpathMatrix from './models/FootpathMatrix';
import GTFS from './GTFS'

type PathElement = {
  start: Stop,
  end: Stop,
  time: number;
  duration: number;
  busPath: BusPath;
}

class BasedRaptor {
  buses: {[number]: Bus};
  start: Stop;
  end: Stop;
  stopsToRoutes: {[string]: Array<number>};
  footpathMatrix: FootpathMatrix;
  startTime: number;

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
  }

  run() {
    let dp = {}
    let Q = {};
    let marked = [];

    // preprocess
    for (let i = 0; i < GTFS.stops.length; i++) {
      dp[GTFS.stops[i].name] = [{
        start: this.start,
        end: GTFS.stops[i],
        time: this.startTime,
        duration: this.footpathMatrix.durationBetween(this.start, GTFS.stops[i]),
        busPath: null
      }];
      marked.push(GTFS.stops[i]);
    }
/*
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < marked.length; i++) {
        let stop = marked[i];
      }
    }
*/
    return dp;
  }

}

export default BasedRaptor;
