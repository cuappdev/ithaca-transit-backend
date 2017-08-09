// @flow
import Path from './Path';
import TCATConstants from '../utils/TCATConstants';
import TimedStop from './TimedStop';

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
    this.paths = [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      for (let j = path.days.start; j <= path.days.end; j++) {
        // Modifications to account for the fact that buses run on different
        // days, and to fit said paths into the framework of the Raptor algo
        const days = {start: j, end: j};
        const augmentedTimedStops = path.timedStops.map(timedStop => {
          let timedStopClone = TimedStop.clone(timedStop);
          timedStopClone.time = timedStop.time + j * TCATConstants.DAY;
          return timedStopClone;
        });
        const augmentedStartTime = j * TCATConstants.DAY + path.startTime;

        this.paths.push(new Path(
          days,
          augmentedTimedStops,
          augmentedStartTime
        ));
      }
    }
  }
}

export default Bus;
