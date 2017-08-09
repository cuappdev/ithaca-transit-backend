// @flow
import Bus from './models/Bus';
import Stop from './models/Stop';
import TCAT from './TCAT';
import TCATConstants from './utils/TCATConstants';

type BackTrack = {
  time: number,
  busNum: number,
  stop: string,
  round: number
};

class Raptor {
  buses: Array<Bus>;
  stops: Array<Stop>;
  startStop: Stop;
  endStop: Stop;
  startTime: number;
  N: number; // rounds of algo (max transfers is N - 1)

  constructor (
    buses: Array<Bus>,
    stops: Array<Stop>,
    startStop: Stop,
    endStop: Stop,
    startTime: number,
    N: number
  ) {
    this.buses = buses;
    this.stops = stops;
    this.startStop = startStop;
    this.endStop = endStop;
    this.startTime = startTime;
    this.N = N;
  }

  _initStopMultiLabelContainer (): { [string]: Array<BackTrack> } {
    let result = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      result[stop.name] =
        new Array(this.N + 1).fill({
          time: Number.MAX_VALUE,
          busNum: -1,
          stop: '',
          round: -1
        });
    }
    result[this.startStop.name] = {
      time: this.startTime,
      busNum: -1,
      stop: '',
      round: -1
    };
    return result;
  }

  // Array of buses with paths with stops with boolean arrays
  _initRouteBookKeeping (): Array<Array<Array<Array<boolean>>>> {
    return this.buses.map(bus => {
      return bus.paths.map(path => {
        return path.timedStops.map(tStop => {
          return new Array(this.N + 1).fill(false);
        });
      });
    });
  }

  _stageOne (
    multiLabels: { [string]: Array<BackTrack> },
    k: number
  ): void {
    for (let key in multiLabels) {
      multiLabels[key][k] =
        JSON.parse(JSON.stringify(multiLabels[key][k - 1]));
    }
  }

  _stageTwo (
    multiLabels: { [string]: Array<BackTrack> },
    k: number,
    routeBookKeeping: Array<Array<Array<Array<boolean>>>>,
  ): void {
    for (let s = 0; s < this.stops.length; s++) {
      // Stop + startTime at this stop
      let stop = this.stops[s];
      let startTime = multiLabels[stop.name][k - 1].time;

      for (let b = 0; b < this.buses.length; b++) {
        for (let p = 0; p < this.buses[b].paths.length; p++) {
          const path = this.buses[b].paths[p];

          if (
            // If we'll never reach this anyway
            path.startTime < startTime ||
            // No one is waiting a day for a bus
            path.startTime > startTime + TCATConstants.DAY
          ) continue;

          // Lookup index
          const stopIndex = path.getStopIndex(stop);

          // If we didn't find the stop at all
          if (stopIndex < 0) continue;

          for (let i = stopIndex; i < path.timedStops.length; i++) {
            const currTimedStop = path.timedStops[i];
            const currStopIdx = TCAT.stopNameToIndex[currTimedStop.stop.name];

            // If true, we already processed this route
            if (routeBookKeeping[b][i][currStopIdx][k]) break;

            // Process
            const prevBestTime = multiLabels[currTimedStop.stop.name][k].time;
            routeBookKeeping[b][i][currStopIdx][k] = true;
            if (currTimedStop.time < prevBestTime) {
              let bus = this.buses[b];
              multiLabels[currTimedStop.stop.name][k] = {
                time: currTimedStop.time,
                busNum: bus.lineNumber,
                stop: stop.name,
                round: k
              };
            }
          }
        }
      }
    }
  }

  // TODO - factor in walking connections
  _stageThree (): void {}

  _backTrack (multiLabels: { [string]: Array<BackTrack> }): Array<BackTrack> {
    let results: Array<BackTrack> = [];

    // While-loop prep
    let currentStop = this.endStop;
    let i = this.N;
    while (i >= 0) {
      const backTrack = multiLabels[currentStop.name][i];
      results.push(backTrack);

      // Update variables
      i = backTrack.round;
      currentStop = TCAT.nameToStop[backTrack.stop];
    }
    return results.reverse();
  }

  run (): Promise<any> {
    // Memoization + book-keeping
    let multiLabels = this._initStopMultiLabelContainer();
    let routeBookKeeping = this._initRouteBookKeeping();

    for (let k = 1; k <= this.N; k++) {
      this._stageOne(multiLabels, k);
      this._stageTwo(multiLabels, k, routeBookKeeping);
      this._stageThree();
    }

    const result = this._backTrack(multiLabels);
    return Promise.resolve(result);
  }
}

export default Raptor;
