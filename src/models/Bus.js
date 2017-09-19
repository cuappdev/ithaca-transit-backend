// @flow
import Stop from './Stop';
import Path from './Path';
import BusPath from './BusPath';

/**
 * A bus line hat runs at various times during the week.  The busline can
 * have multiple "paths" it takes, which are essentially loops or contiguous
 * series of traveling periods where the bus moves along a designated series
 * of stops.
 */
class Bus {
  paths: Array<Path>;
  lineNumber: number;

  constructor (paths: Array<Path>, lineNumber: number) {
    this.lineNumber = lineNumber;
    this.paths = paths;
  }

  earliestTripForward (stop: Stop, time: number): ?BusPath {
    let path = this.paths.find(d => d.hasStopAfterTime(stop, time));
    if (!path) {
      return null;
    }
    let busPath = new BusPath(this.lineNumber, path, stop, true);
    return busPath;
  }
}

export default Bus;
