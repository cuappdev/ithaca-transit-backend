// @flow
import Stop from './Stop';
import TimedStop from './TimedStop';

export type DaySequence = {
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

  constructor (days: DaySequence, timedStops: Array<TimedStop>) {
    this.days = days;
    this.timedStops = timedStops;
  }

  findTimedStop (time: number, stop: Stop) {
    // Aiming to find exact stop according to time, or boundary
    const binarySearchRouteTimedStop = (time: number): number => {
      if (this.timedStops.length === 0) return -1; // Nothing to look for
      // Setup everything
      let i = 0;
      let j = this.timedStops.length - 1;
      let k = (i + j) / 2;

      while (i <= j) {
        // Check if we've found it (either the time or the boundary)
        const equal = this.timedStops[k].time === time;
        const boundary = (
          this.timedStops[Math.max(k - 1, 0)].time < time &&
          this.timedStops[k].time > time
        );
        if (equal || boundary) return k;

        // Move on if not
        if (this.timedStops[k].time < time) i = k + 1;
        else j = k - 1;
        k = (i + j) / 2;
      }

      // We didn't find it above
      return -1;
    };

    // Range scan once we found the exact stop / boundary based on time
    const scanToFind = (stop: Stop, i: number): number => {
      const firstStop = this.timedStops[i].stop;
      // If we've found it
      if (firstStop.equals(stop)) return i;
      // Scan for it
      let idx = i + 1;
      while (idx < this.timedStops.length) {
        // We found it
        if (this.timedStops[idx].stop.equals(stop)) return idx;
        // We'll never find it
        if (this.timedStops[idx].stop.equals(firstStop)) return -1;
        idx++;
      }
      return -1;
    };

    const i = binarySearchRouteTimedStop(time);
    if (i !== -1) return scanToFind(stop, i);
    return -1;
  }
}

export default Path;
