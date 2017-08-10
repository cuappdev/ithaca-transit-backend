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

  constructor (
    days: DaySequence,
    timedStops: Array<TimedStop>,
  ) {
    this.days = days;
    this.timedStops = timedStops;
  }

  runsOnDay (day: number) {
    return day >= this.days.start && day <= this.days.end;
  }
}

export default Path;
