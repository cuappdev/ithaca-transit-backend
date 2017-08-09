// @flow
import Stop from './Stop';

/**
 * A stop with time information
 */
class TimedStop {
  stop: Stop;
  time: number; // 0 = 12:00AM, 3600 = 1:00AM, etc.

  static clone (timedStop: TimedStop) {
    return new TimedStop(timedStop.stop, timedStop.time);
  }

  constructor (stop: Stop, time: number) {
    this.stop = stop;
    this.time = time;
  }
}

export default TimedStop;
