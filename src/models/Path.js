// @flow
import TimedStop from './TimedStop';

type DaySequence = {
  start: number,
  end: number
};

/**
 * The overall path a bus moves along during certain days of operation,
 * indicated by "days" field
 */
class Path {
  days: DaySequence;
  timedStops: Array<TimedStop>;
  startTime: number;

  constructor (
    days: DaySequence,
    timedStops: Array<TimedStop>,
    startTime: number,
  ) {
    this.days = days;
    this.timedStops = timedStops;
    this.startTime = startTime;
  }
}

export default Path;
