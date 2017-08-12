
import Location from './Location';

class Kml {
  lineNumber: number;
  placemark: string;
  locations: Array<Location>;

  constructor (lineNumber: number, placemark: string, locations: Array<Location>) {
    this.lineNumber = lineNumber;
    this.placemark = placemark;
    this.locations = locations; 
  }
}

export default Bus;
