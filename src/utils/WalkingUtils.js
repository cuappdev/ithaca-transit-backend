// @flow

import ErrorUtils from './ErrorUtils';

function parseWalkingRoute(data: any, startDateMs: number, destinationName: string) {
    try {
        const path = data.paths[0];
        const endDateMs = startDateMs + path.time;

        const departureTime = `${new Date(startDateMs).toISOString()
            .split('.')[0]}Z`;
        const arrivalTime = `${new Date(endDateMs).toISOString()
            .split('.')[0]}Z`;

        const boundingBox = {
            minLat: path.bbox[1],
            minLong: path.bbox[0],
            maxLat: path.bbox[3],
            maxLong: path.bbox[2],
        };

        const startCoords = {
            lat: path.points.coordinates[0][1],
            long: path.points.coordinates[0][0],
        };

        const endCoords = {
            lat: path.points.coordinates[path.points.coordinates.length - 1][1],
            long: path.points.coordinates[path.points.coordinates.length - 1][0],
        };

        const numberOfTransfers = 0;

        const walkingPath = path.points.coordinates.map(point => ({
            lat: point[1],
            long: point[0],
        }));

        const direction = {
            type: 'walk',
            name: destinationName,
            startTime: departureTime,
            endTime: arrivalTime,
            startLocation: startCoords,
            endLocation: endCoords,
            path: walkingPath,
            distance: path.distance,
            routeNumber: null,
            stops: [],
            tripIdentifiers: null,
            delay: null,
        };

        return {
            departureTime,
            arrivalTime,
            directions: [direction],
            startCoords,
            endCoords,
            boundingBox,
            numberOfTransfers,
        };
    } catch (e) {
        ErrorUtils.log(e, { data, startDateMs, destinationName }, 'Parse walking route failed');
        return null;
    }
}

export default {
    parseWalkingRoute,
};
