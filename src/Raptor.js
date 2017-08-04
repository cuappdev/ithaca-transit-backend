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
    routeBookKeeping: Array<Array<Array<Array<boolean>>>>
  ): void {
    for (let s = 0; s < this.stops.length; s++) {
      // Stop + startTime at this stop
      let stop = this.stops[s];
      let startTime = multiLabels[stop.name][k - 1].time;

      for (let b = 0; b < this.buses.length; b++) {
        for (let p = 0; p < this.buses[b].paths.length; p++) {
          // Given a stop, survey routes for that stop with appropriate timeframe

          // Once find one with appropriate timeframe, progress along the path, marking off
          // the stops as you hit them... if try and hit a stop that has already been hit, we
          // can stop

          // When you get to a stop, mark it with the bus #, the stop which we got on
          // at in order to reach this stop, and the time we would get to this stop

          // Back-track from the final destination location to the start, grabbing
          // start and end locations of trips, as well as the line that was taken for that trio
        }
      }
    }
  }

  _stageThree (): void {
    // TODO - foot-transfers
  }

  run () {
    // Memoization + book-keeping
    let multiLabels = this._initStopMultiLabelContainer();
    let routeBookKeeping = this._initRouteBookKeeping();

    for (let k = 1; k <= this.N; k++) {
      this._stageOne(multiLabels, k);
      this._stageTwo(multiLabels, k, routeBookKeeping);
      this._stageThree();
    }
  }
}

export default Raptor;
