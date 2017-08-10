// @flow
import Path from './Path';
import Stop from './Stop';
import TCATConstants from '../utils/TCATConstants';
import TimedStop from './TimedStop';

/**
 * A path that is used in the Raptor routing algorithm.
 * This path represents a path at a particular time of
 * the week.  While a `Path` represents the general
 * set of timed stops and the days said stops are traversed,
 * this model represents a particular, point-in-time
 * path traversal (e.g. on Tuesday from 4:03PM to 4:15PM,
 * TCAT #30 traverses stops X, Y, and Z with arrival times of
 * 4:03PM, 4:08PM, and 4:15PM).
 */
class RaptorPath {
  day: number;
  tcatNum: number;
  timedStops: Array<TimedStop>;

  _stopToIndex: { [string]: number } // For quick look-ups

  constructor (day: number, tcatNum: number, timedStops: Array<TimedStop>) {
    this.day = day;
    this.tcatNum = tcatNum;
    this.timedStops = timedStops;

    this._stopToIndex = {};

    for (let i = 0; i < this.timedStops.length; i++) {
      this._stopToIndex[this.timedStops[i].stop.name] = i;
    }
  }

  static fromPath (path: Path, day: number, tcatNum: number): RaptorPath {
    if (!path.runsOnDay(day % 7)) throw new Error('Invalid day given');
    const timedStops = path.timedStops.map(tStop => {
      // Clone + update time of running
      let clonedtStop = TimedStop.clone(tStop);
      clonedtStop.time = day * TCATConstants.DAY + tStop.time;
      return clonedtStop;
    });

    return new RaptorPath(day, tcatNum, timedStops);
  }

  getStopIndex (stop: Stop): number {
    const i = this._stopToIndex[stop.name];
    return i || -1;
  }
}

export default RaptorPath;
