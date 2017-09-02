// @flow
import Stop from './Stop';

/**
 * A stop with time information
 */
class TimedStop {
  stop: Stop;
  time: number; // 0 = 12:00AM, 3600 = 1:00AM, etc.
  timepoint: boolean;

  static clone (timedStop: TimedStop) {
    return new TimedStop(timedStop.stop, timedStop.time, timedStop.timepoint);
  }

  constructor (stop: Stop, time: number, timepoint: boolean) {
    this.stop = stop;
    this.time = time;
    this.timepoint = timepoint;
  }
}

export default TimedStop;
