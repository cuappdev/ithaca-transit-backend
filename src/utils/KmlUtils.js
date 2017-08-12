
import Location from '../models/Location';

const locationsFromPlacemark = (placemark: string): Array<Location> => {
  var regex = /-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+/g;
  var locations = placemark
    .match(regex)
    .map(a => a.split(",")
      .map(b => Number(b))
      .slice(0,2))
    .map(a => new Location(a[1], a[0]))

  return locations;
}

export default {
  locationsFromPlacemark
}