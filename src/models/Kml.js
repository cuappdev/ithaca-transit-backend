
import Location from './Location';
import Stop from './Stop';
import KmlUtils from '../utils/KmlUtils'

class Kml {
  // Line number of the bus this KML corresponds to
  lineNumber: number;
  // The full placemark - in case we need it in future revisions of the implementation
  placemark: string;
  // The placemark "prefix" - the LEADING portion of this KML that does not contain coordinates
  placemarkPrefix: string;
  // The placemark "suffix" - the TRAILING tion of this KML that does not contain coordinates
  placemarkSuffix: string;
  // The list of all locations in the KML
  locations: Array<Location>;

  constructor (lineNumber: number, placemark: string) {
    this.lineNumber = lineNumber;
    this.placemark = placemark;

    // The format is longitude,latitude,0 (why 0? TCAT doin a bamboozle?)
    let regex = /-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+/g;
    let locations = placemark
      .match(regex);

    // first and last locations in the KML
    let firstLocation = locations[0];
    let lastLocation = locations[locations.length-1];

    // The indices to use when slicing the KML into the prefix and suffix
    let locationsStart = placemark.indexOf(firstLocation);
    let locationsEnd = placemark.indexOf(lastLocation) + lastLocation.length;

    this.placemarkPrefix = placemark.substring(0, locationsStart);
    this.placemarkSuffix = placemark.substring(locationsEnd);
    this.locations = locations
      .map(a => a
        .split(",") // split into three number strings
        .map(b => Number(b)) // convert the numbers
        .slice(0,2)) // Grab the first two (third provided but irrelevant)
      .map(a => new Location(a[1], a[0])) // the order in the KML is longitude, latitude; the constructor takes latitude, longitude
  }

  placemarkFromStartEndStops (start: Stop, end: Stop) {
    let startIndex = this.locations
      .map(a => a.distance(start.location))
      .reduce((icur, x, i, arr) => x < arr[icur] ? i : icur, 0);
    let endIndex = this.locations
      .map(a => a.distance(end.location))
      .reduce((icur, x, i, arr) => x < arr[icur] ? i : icur, 0);
    
    // rotate locations so that start stops is at index 0
    let locationsRotated = KmlUtils.rotatedArray(this.locations, startIndex);
    
    // compute the number of locations to include in placemark
    var length = endIndex - startIndex;
    length = length < 0 ? length + this.locations.length : length;
    
    let locationsString = this.locations
      .slice(0, length)
      .map(a => a.longitude + ',' + a.latitude + ',0')
      .join(' ');

    let placemarkNew = this.placemarkPrefix + locationsString + this.placemarkSuffix;
    return placemarkNew;
  }
}

export default Kml;
