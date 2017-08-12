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
    return (
      location.latitude === this.latitude &&
      location.longitude === this.longitude
    );
  }

  distance (location: Location): number {
    return (
      (this.latitude - location.latitude) * (this.latitude - location.latitude) +
      (this.longitude - location.longitude) * (this.longitude - location.longitude)
      );
  }

  toArray (): Array<number> {
    return [this.longitude, this.latitude];
  }
}

export default Location;
