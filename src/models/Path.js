// @flow
import TimedStop from './TimedStop';

/**
 * The overall path a bus moves along during certain days of operation,
 * indicated by "days" field
 */
class Path {
  timedStops: Array<TimedStop>;

  constructor (timedStops: Array<TimedStop>) {
    this.timedStops = timedStops;
  }
}

export default Path;
