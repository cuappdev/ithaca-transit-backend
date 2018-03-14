//@flow

function parseWalkingRoute(data, startDateMs) {
    let path = data.paths[0];
    let endDateMs = startDateMs + path.time;

    let departureTime = new Date(startDateMs).toISOString().split('.')[0]+"Z";
    let arrivalTime = new Date(endDateMs).toISOString().split('.')[0]+"Z";


    let boundingBox = {
        minLat: path.bbox[1],
        minLong: path.bbox[0],
        maxLat: path.bbox[3],
        maxLong: path.bbox[2]
    };

    let startCoords = {
        lat: path.points.coordinates[0][1],
        long: path.points.coordinates[0][0]
    };

    let endCoords = {
        lat: path.points.coordinates[path.points.coordinates.length - 1][1],
        long: path.points.coordinates[path.points.coordinates.length - 1][0]
    };

    let numberOfTransfers = 0

    let walkingPath = path.points.coordinates.map(point => {
        return {
            lat: point[1],
            long: point[0]
        };
    });

    let direction = {
        type: "walk",
        name: "your destination",
        startTime: departureTime,
        endTime: arrivalTime,
        startLocation: startCoords,
        endLocation: endCoords,
        path: walkingPath,
        distance: path.distance,
        routeNumber: null,
        stops: [],
        tripIdentifiers: null,
        delay: null
    };

    return {
       departureTime: departureTime,
       arrivalTime: arrivalTime,
       directions: [direction],
       startCoords: startCoords,
       endCoords: endCoords,
       boundingBox: boundingBox,
       numberOfTransfers: numberOfTransfers
    };
}

export default {
    parseWalkingRoute: parseWalkingRoute
}