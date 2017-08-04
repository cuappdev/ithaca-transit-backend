// @flow
import Stop from './models/Stop';

class Raptor {
  stops: Array<Stop>;
  startStop: Stop;
  endStop: Stop;
  startTime: number;
  N: number; // rounds of algo (max transfers is N - 1)

  constructor (
    stops: Array<Stop>,
    startTime: number,
    N: number
  ) {
    this.stops = stops;
    this.startTime = startTime;
    this.N = N;
  }

  _initStopMultiLabelContainer (): Object {
    let result = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      result[stop.name] =
        new Array(this.N).fill((Number.MAX_VALUE, null));
    }
    result[this.startStop.name] = (this.startTime, null);
    return result;
  }

  _stageOne (multiLabels: Object, k: number): void {
    for (let key in multiLabels) {
      multiLabels[key][k] = multiLabels[key][k - 1];
    }
  }

  _stageTwo (): void {
    // TODO
  }

  _stageThree (): void {
    // TODO
  }

  run () {
    // DP memoization storage
    let multiLabels = this._initStopMultiLabelContainer();
    for (let k = 1; k <= this.N; k++) {
      this._stageOne(multiLabels, k);
    }
  }
}

export default Raptor;
