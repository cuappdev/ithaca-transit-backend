// @flow
import TimedStop from './TimedStop';

/**
 * The overall path a bus moves along during certain days of operation,
 * indicated by "days" field
 */
class Path {
  serviceID: number;
  timedStops: Array<TimedStop>;

  constructor (serviceID: number, timedStops: Array<TimedStop>) {
    this.serviceID = serviceID;
    this.timedStops = timedStops;
  }
}

export default Path;
