import Location from './Location'
import Stop from './Stop'

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

  durationBetween(stop1: Stop, stop2: Stop) {
    let i = this._stopsToIndex[stop1.name];
    let j = this._stopsToIndex[stop2.name];
    return durations[i][j];
  }

}

export default FootpathMatrix
