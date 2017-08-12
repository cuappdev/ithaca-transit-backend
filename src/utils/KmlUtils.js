
import Location from '../models/Location';

const locationsFromPlacemark = (placemark: string): Array<Location> => {
	var regex = /-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+,-?[\d|.|e|E|\+]+/g;
	var start = 0;
	for (let i = 0; i < placemark.length; i++) {
		var jspace = placemark.indexOf(" ", i);
		var substr = placemark.substring(i, jspace);
		if (substr.match(regex) != null) {
			start = i;
			break;
		}
	}

	var end = 0;
	for (let i = start; i < placemark.length; i++) {
		var jspace = placemark.indexOf(" ", i);
		var substr = placemark.substring(i, jspace);
		if (substr.match(regex) == null) {
			end = i;
			break;
		}
		i += substr.length;
	}

	var coordinateStr = placemark.substring(start, end);
	var locations = coordinateStr
		.trim()
		.split(" ")
		.map(a => a.split(",")
			.map(b => Number(b))
			.slice(0,2))
		.map(a => new Location(a[1], a[0]))

	return locations;
}

export default {
	locationsFromPlacemark
}