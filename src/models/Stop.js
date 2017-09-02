// @flow
import Location from './Location';

/**
 * A stop in the area, articulating essential details about that stop, such
 * as name, location, etc.  Example: "Shops at Ithaca Mall @ Sears"
 */
class Stop {
  name: string;
  location: Location;

  constructor (name: string, location: Location) {
    this.name = name;
    this.location = location;
  }

  equals (route: Stop): boolean {
    return this.name === route.name && this.location.equals(route.location);
  }
}

export default Stop;
