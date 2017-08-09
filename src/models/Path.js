// @flow
import Stop from './Stop';
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
  stopToIndex: { [string]: number } // For quick look-ups

  constructor (
    days: DaySequence,
    timedStops: Array<TimedStop>,
  ) {
    this.days = days;
    this.timedStops = timedStops;
    this.stopToIndex = {};

    for (let i = 0; i < this.timedStops.length; i++) {
      this.stopToIndex[this.timedStops[i].stop.name] = i;
    }
  }

  getStopIndex (stop: Stop): number {
    const i = this.stopToIndex[stop.name];
    return i || -1;
  }
}

export default Path;
