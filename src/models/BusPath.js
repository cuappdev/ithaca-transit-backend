// @flow
import Path from './Path';
import Stop from './Stop';
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
class BusPath {
  lineNumber: number;
  path: Path;
  cutoff: Stop;
  isForward: boolean;

  constructor (
    lineNumber: number,
    path: Path,
    cutoff: Stop, // start of the trip according to the markings of Raptor
    isForward: boolean
  ) {
    this.lineNumber = lineNumber;
    this.path = path;
    this.cutoff = cutoff;
    this.isForward = isForward;
  }

  comesBeforeStartAfterTime (stop: Stop, time: number): boolean {
    let stopIndex = this.path.getStopIndex(stop);
    let cutoffIndex = this.path.getStopIndex(this.cutoff);
    return stopIndex < cutoffIndex && this.path.hasStopAfterTime(stop, time);
  }

  length (): number {
    return this.path.length() - this.path.getStopIndex(this.cutoff);
  }

  getStop (i: number): TimedStop {
    return this.path.getStop(i + this.path.getStopIndex(this.cutoff));
  }
}

export default BusPath;
