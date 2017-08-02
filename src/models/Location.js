// @flow

/**
 * A (lat, long) tuple articulating a location in the Ithaca area
 */
class Location {
  latitude: number;
  longitude: number;

  constructor (latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  equals (location: Location): boolean {
    return (location.latitude === this.latitude &&
      location.longitude === this.longitude);
  }
}

export default Location;
