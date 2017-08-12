
import Location from '../models/Location';
import Stop from '../models/Stop';

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



const kmlApproximation = (kml, stop1: Stop, stop2: Stop): Array<Location> => {
  
  var start = 0;
  var end = 0;
  for (let i = 0; i < kml.locations.length; i++) {
    if (kml.locations[i].distance(stop1.location) < kml.locations[i].distance(kml.locations[start])) {
      start = i;
    }

    if (kml.locations[i].distance(stop2.location) < kml.locations[i].distance(kml.locations[end])) {
      start = i;
    }
  }

  function arrayRotate(arr, count) {
    count -= arr.length * Math.floor(count / arr.length)
    arr.push.apply(arr, arr.splice(0, count))
    return arr
  }

  var rot = arrayRotate(kml.locations, start);
  var sublist = rot.slice(0, Math.abs(start - end));
  return sublist;
} 

export default {
  locationsFromPlacemark,
  kmlApproximation
}