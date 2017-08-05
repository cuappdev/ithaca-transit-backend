// @flow
import Bus from './models/Bus';
import Stop from './models/Stop';
import TCAT from './TCAT';

type BackTrack = {
  time: number,
  busNum: number,
  stop: ?string
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
    startTime: number,
    N: number
  ) {
    this.buses = buses;
    this.stops = stops;
    this.startTime = startTime;
    this.N = N;
  }

  _initStopMultiLabelContainer (): { [string]: Array<BackTrack> } {
    let result = {};
    for (let i = 0; i < this.stops.length; i++) {
      const stop = this.stops[i];
      result[stop.name] =
        new Array(this.N).fill({
          time: Number.MAX_VALUE,
          busNum: -1,
          stop: null
        });
    }
    result[this.startStop.name] = {
      time: this.startTime,
      busNum: -1,
      stop: null
    };
    return result;
  }

  // Array of buses with paths with stops with boolean arrays
  _initRouteBookKeeping (): Array<Array<Array<Array<boolean>>>> {
    return this.buses.map(bus => {
      return bus.paths.map(path => {
        return path.timedStops.map(tStop => {
          return new Array(this.N).fill(false);
        });
      });
    });
  }

  _stageOne (
    multiLabels: { [string]: Array<BackTrack> },
    k: number
  ): void {
    for (let key in multiLabels) {
      multiLabels[key][k] = multiLabels[key][k - 1];
    }
  }

  _stageTwo (
    multiLabels: { [string]: Array<BackTrack> },
    k: number,
    routeBookKeeping: Array<Array<Array<Array<boolean>>>>,
    durations: Array<Array<number>>,
  ): void {
    for (let s = 0; s < this.stops.length; s++) {
      // Stop + startTime at this stop
      let stop = this.stops[s];
      let startTime = multiLabels[stop.name][k - 1].time;

      for (let b = 0; b < this.buses.length; b++) {
        for (let p = 0; p < this.buses[b].paths.length; p++) {
          const path = this.buses[b].paths[p];
          // If we'll never reach this anyway
          if (path.startTime < startTime) continue;

          let i = 0;
          let foundRoute = false;
          while (
            i < path.timedStops.length &&
            !routeBookKeeping[s][b][i][k] &&
            path.timedStops[i].time > startTime
          ) {
            if (path.timedStops[i].stop.equals(stop)) {
              foundRoute = true;
              break;
            }
            i++;
          }

          if (foundRoute) {
            i++;
            while (
              i < path.timedStops.length &&
              !routeBookKeeping[s][b][i][k]
            ) {
              // Start stop information
              const startRouteStop = path.timedStops[i - 1];
              const startStopIndex =
                TCAT.stopNameToIndex[startRouteStop.stop.name];
              // End stop information
              const endRouteStop = path.timedStops[i];
              const endStopIndex =
                TCAT.stopNameToIndex[endRouteStop.stop.name];
              // Check this off as seen
              routeBookKeeping[s][b][i][k] = true;
              // Time information
              const timeOfArrival =
                startRouteStop.time + durations[startStopIndex][endStopIndex];
              const kMinusOneArrival =
                multiLabels[endRouteStop.stop.name][k - 1];
              // Update
              if (kMinusOneArrival.time < timeOfArrival) {
                multiLabels[endRouteStop.stop.name][k] = kMinusOneArrival;
              } else {
                let bus = this.buses[b];
                multiLabels[endRouteStop.stop.name][k] = {
                  time: timeOfArrival,
                  busNum: bus.lineNumber,
                  stop: stop.name
                };
              }
            }
          }
        }
      }
    }
  }

  _stageThree (): void {
    // TODO - can be no-op for now
  }

  _backTrack (multiLabels: { [string]: Array<BackTrack> }): Array<any> {
    // TODO
    return [];
  }

  run (): Promise<any> {
    return TCAT.distanceMatrix.then(response => {
      const durations = response.durations;
      // Memoization + book-keeping
      let multiLabels = this._initStopMultiLabelContainer();
      let routeBookKeeping = this._initRouteBookKeeping();

      for (let k = 1; k <= this.N; k++) {
        this._stageOne(multiLabels, k);
        this._stageTwo(multiLabels, k, routeBookKeeping, durations);
        this._stageThree();
      }

      this._backTrack(multiLabels);
      return Promise.resolve(null);
    });
  }
}

export default Raptor;
