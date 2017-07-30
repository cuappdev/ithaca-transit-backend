// @flow
import Location from './Location';

class Stop {
  name: string;
  location: Location;

  constructor (name: string, location: Location) {
    this.name = name;
    this.location = location;
  }
}

export default Stop;
