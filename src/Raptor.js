// @flow
import RaptorPath from './models/RaptorPath';
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
  paths: Array<RaptorPath>;
  stops: Array<Stop>;
  startStop: Stop;
  endStop: Stop;
  startTime: number;
  N: number; // rounds of algo (max transfers is N - 1)

  constructor (
    paths: Array<RaptorPath>,
    stops: Array<Stop>,
    startStop: Stop,
    endStop: Stop,
    startTime: number,
  ) {
    this.paths = paths;
    this.stops = stops;
    this.startStop = startStop;
    this.endStop = endStop;
    this.startTime = startTime;
    this.N = TCATConstants.MAX_RAPTOR_ROUNDS;
  }

  _initStopMultiLabelContainer (): { [string]: Array<BackTrack> } {
    let result = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      result[stop.name] =
        new Array(this.N + 1).fill({
          time: TCATConstants.INFINITY,
          busNum: -1,
          stop: '',
          round: -1
        });
    }
    // Set first one accordingly
    result[this.startStop.name][0] = {
      time: this.startTime,
      busNum: -1,
      stop: '',
      round: -1
    };
    return result;
  }

  // Array of buses with paths with stops with boolean arrays
  _initRouteBookKeeping (): Array<Array<Array<boolean>>> {
    return this.paths.map(path => {
      return path.timedStops.map(tStop => {
        return new Array(this.N + 1).fill(false);
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
    routeBookKeeping: Array<Array<Array<boolean>>>,
  ): void {
    for (let s = 0; s < this.stops.length; s++) {
      // Stop + startTime at this stop
      let stop = this.stops[s];
      let startTime = multiLabels[stop.name][k - 1].time;

      // Go through all paths
      for (let p = 0; p < this.paths.length; p++) {
        const path = this.paths[p];

        // Lookup index
        const stopIndex = path.getOriginalPath().getStopIndex(stop);

        // If we didn't find the stop at all
        if (stopIndex < 0) continue;

        for (let i = stopIndex; i < path.timedStops.length; i++) {
          const currTimedStop = path.timedStops[i];

          // If true, we already processed this route
          if (routeBookKeeping[p][i][k]) break;

          // If it's impossible to reach
          if (currTimedStop.time < startTime) continue;

          // Process
          const prevBestTime = multiLabels[currTimedStop.stop.name][k].time;
          routeBookKeeping[p][i][k] = true;
          if (currTimedStop.time < prevBestTime) {
            multiLabels[currTimedStop.stop.name][k] = {
              time: currTimedStop.time,
              busNum: path.tcatNum,
              stop: stop.name,
              round: k
            };
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
    while (i > 1) {
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
