// @flow
import Stop from './Stop';

const GTFS_STOP_START = 2;

class FootpathMatrix {
  stops: Array<Stop>;
  durations: Array<Array<number>>;
  _stopsToIndex: {[string]: number};

  constructor (stops: Array<Stop>, durations: Array<Array<number>>) {
    this.stops = stops;
    this.durations = durations;
    this._stopsToIndex = {};
    for (let i = 0; i < this.stops.length; i++) {
      this._stopsToIndex[this.stops[i].name] = i;
    }
  }

  durationBetween (stop1: Stop, stop2: Stop): number {
    let i = this._stopsToIndex[stop1.name];
    let j = this._stopsToIndex[stop2.name];
    return this.durations[i][j];
  }

  durationsToGTFSStops (stop: Stop): Array<number> {
    let stopIndex = this._stopsToIndex[stop];
    let durations = this.durations[stopIndex];
    return durations.slice(GTFS_STOP_START);
  }
}

export default FootpathMatrix;
