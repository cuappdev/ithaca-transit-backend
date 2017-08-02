// @flow
import Stop from './Stop';

/**
 * A stop with time information
 */
class TimedStop {
  stop: Stop;
  time: number; // 0 = 12:00AM, 60 = 1:00AM, etc.

  constructor (stop: Stop, time: number) {
    this.stop = stop;
    this.time = time;
  }
}

export default TimedStop;
