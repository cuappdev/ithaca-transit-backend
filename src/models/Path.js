// @flow
import Stop from './Stop';
import TimedStop from './TimedStop';

/**
 * The overall path a bus moves along during certain days of operation,
 * indicated by "days" field
 */
class Path {
  timedStops: Array<TimedStop>;
  _stopToIndex: { [string]: number } // For quick look-ups

  constructor (timedStops: Array<TimedStop>) {
    this.timedStops = timedStops;
    this._stopToIndex = {};
    for (let i = 0; i < this.timedStops.length; i++) {
      this._stopToIndex[this.timedStops[i].stop.name] = i;
    }
  }

  getStopIndex (stop: Stop): number {
    return !(this._stopToIndex.hasOwnProperty(stop.name))
      ? -1
      : this._stopToIndex[stop.name];
  }

  startTime (): number {
    return this.timedStops.find(d => !(d.time)).time;
  }

  hasStopAfterTime (stop: Stop, time: number): boolean {
    let stopIndex = this.getStopIndex(stop);
    return stopIndex !== -1 && time < this.timedStops[stopIndex].time;
  }

  length () {
    return this.timedStops.length;
  }

  getStop (i: number): TimedStop {
    return this.timedStops[i];
  }
}

export default Path;
