// @flow
import createGpx from 'gps-to-gpx';

import { MAP_MATCHING } from './EnvUtils';
import AllStopUtils from './AllStopUtils';
import GTFSUtils from './GTFSUtils';
import LogUtils from './LogUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import RequestUtils from './RequestUtils';

const DIRECTION_TYPE = {
  DEPART: 'depart',
  WALK: 'walk',
};
const ONE_DAY_IN_MS = 86400000;
const ONE_HOUR_IN_MS = 3600000;
const ONE_MIN_IN_MS = 60000;

/**
 * distanceBetweenPoints(point1, point2) returns the distance between two points in miles
 * using the Haversine formula
 */
function distanceBetweenPointsMiles(point1: Object, point2: Object): number {
  const radlat1 = Math.PI * point1.lat / 180;
  const radlat2 = Math.PI * point2.lat / 180;
  const theta = point1.long - point2.long;
  const radtheta = Math.PI * theta / 180;
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist;
}

function createGpxJson(stops: Array<Object>, startTime: String): Object {
  const waypoints = stops.map(stop => ({
    latitude: stop.lat,
    longitude: stop.long,
    elevation: 0,
    time: startTime,
  }));
  return {
    activityType: 'GraphHopper Track',
    startTime,
    waypoints,
  };
}

/**
 * Merge two dirctions
 * @param first
 * @param second
 * @returns {{type: *, name: *, startTime: *, endTime: *,
 * startLocation: ({lat: *, long: *}|*),
 * endLocation: ({lat: *, long: *}|*),
 * path: T[] | string | *, distance: *,
 * routeNumber: (null|*), stops: T[], tripIdentifiers: T[] | string | *}}
 */
function mergeDirections(first, second): Object {
  second.stops.shift();
  second.path.shift();

  const path = first.path.concat(second.path);
  const distance = first.distance + second.distance;
  const stops = first.stops.concat(second.stops);
  const tripIDs = first.tripIdentifiers.concat(second.tripIdentifiers);

  return {
    distance,
    endLocation: second.endLocation,
    endTime: second.endTime,
    name: first.name,
    path,
    routeNumber: first.routeNumber,
    startLocation: first.startLocation,
    startTime: first.startTime,
    stops,
    tripIdentifiers: tripIDs,
    type: first.type,
  };
}

/**
 * Trims first and/or last directions if they are unnecessary walking directions
 * @param route
 * @param startCoords
 * @param endCoords
 * @returns {Promise<void>}
 */
async function trimFirstLastDirections(route, startCoords, endCoords) {
  const minWalkingDirDistanceMeters = 45.0;

  // if the direction walking distance is < minWalkingDirDistanceMeters
  if (route.directions[0].distance < minWalkingDirDistanceMeters) {
    const startLocIsStop = await AllStopUtils.isStopsWithinPrecision(
      startCoords,
      AllStopUtils.DEG_WALK_PRECISION,
    );

    if (startLocIsStop) {
      route.directions.shift();
    }
  }

  if (route.directions[route.directions.length - 1].distance < minWalkingDirDistanceMeters) {
    const endLocIsStop = await AllStopUtils.isStopsWithinPrecision(
      endCoords,
      AllStopUtils.DEG_WALK_PRECISION,
    );

    if (endLocIsStop) {
      route.directions.pop();
    }
  }
}

/**
 * - Removes unnecessary start and end directions (walking directions to stops <15 feet away)
 * - Merges directions that indicate an on-bus change in route-IDs where no action required
 * - Checks route walking distance does not exceed specified maximum
 * - Checks user can make the bus
 * - Checks directions not excessively long
 * @param route
 * @param startCoords
 * @param endCoords
 * @param maxWalkingDistance
 * @param departureDelayBuffer
 * @param departureTimeNowMs
 * @returns {Object}
 */
async function condenseRoute(
  route: Object,
  startCoords: Object,
  endCoords: Object,
  maxWalkingDistance: number,
  departureDelayBuffer: boolean,
  departureTimeNowMs: number,
) {
  await trimFirstLastDirections(route, startCoords, endCoords);

  let previousDirection = null;
  let totalDistanceWalking = 0;

  for (let index = 0; index < route.directions.length; index++) {
    const direction = route.directions[index];
    const startTime = Date.parse(direction.startTime);
    const endTime = Date.parse(direction.endTime);

    // Discard routes with directions that take over 2 hours time
    if (startTime + (ONE_HOUR_IN_MS * 2) <= endTime) {
      return null;
    }

    /**
     * Discard routes where not possible to walk to bus given departure buffer
     * We subtract ONE_MIN_IN_MS from departureTimeNow to avoid the
     * case where we don't show a bus leaving at the same minute as departureTime.
     * We also have to account for the delay time because if a bus is delayed, we want to display
     * the route even if the start time is earlier than the current time.
     */
    if (departureDelayBuffer && direction.type === DIRECTION_TYPE.DEPART) {
      const delayMs = direction.delay !== null ? direction.delay * 1000 : 0;
      if (startTime < departureTimeNowMs - ONE_MIN_IN_MS - delayMs) {
        return null;
      }
    }

    if (previousDirection
      && previousDirection.type === DIRECTION_TYPE.DEPART
      && direction.type === DIRECTION_TYPE.DEPART) {
      /*
       * Discard route if a depart direction's last stopID is not equal to the next direction's first stopID,
       * Fixes bug where graphhopper directions are to get off at a stop and get on another stop
       * far away with no walking direction in between, EG: 1. get off at Statler 2. board at RPCC
       */
      if (previousDirection.stops[previousDirection.stops.length - 1].stopID
        !== direction.stops[0].stopID) {
        return null;
      }

      /*
       * If consecutive bus directions have the same routeNumber,
       * then replace the last direction with merged directions and remove the current direction.
       * No real transfer, probably just change in trip_ids.
       */
      if (previousDirection.routeNumber === direction.routeNumber) {
        route.directions.splice(index - 1, 2, mergeDirections(previousDirection, direction));
        index -= 1; // since we removed an element from the array
      }

      // Discard routes with over 1 hours time waiting between each direction
      if (previousDirection) {
        const prevEndTime = Date.parse(previousDirection.endTime);
        if (prevEndTime + ONE_HOUR_IN_MS < startTime) {
          return null;
        }
      }
    }

    if (direction.type === DIRECTION_TYPE.WALK) {
      totalDistanceWalking += direction.distance;
    }
    previousDirection = direction;
  }

  // if a bus route has more walking distance than the walking route, discard route
  // or route has 0 directions
  if (totalDistanceWalking > maxWalkingDistance || route.directions.length === 0) {
    return null;
  }

  return adjustRouteTimesIfNecessary(route);
}

/**
 * If the route arrivalTime and departureTime are within the same minute, increase the
 * arrivalTime by one minute
 * @param route
 * @returns {Object}
 */
function adjustRouteTimesIfNecessary(route: Object): Object {
  const departureDate = new Date(route.departureTime);
  const arrivalDate = new Date(route.arrivalTime);

  const isWithinMinute = departureDate.getTime() + ONE_MIN_IN_MS > arrivalDate.getTime();
  const isSameMinute = departureDate.getMinutes() === arrivalDate.getMinutes();

  if (isWithinMinute && isSameMinute) {
    route.arrivalTime = convertMillisecondsToISOString(arrivalDate.getTime() + ONE_MIN_IN_MS);
  }
  return route;
}

/**
 * Returns coordinate objects with lat/long after taking in Graphhopper point arrays.
 *
 * @param startPathPoints
 * @param endPathPoints
 * @returns {Object}
 */
function getStartEndCoords(startPathPoints: Object, endPathPoints: Object): { startCoords: Object, endCoords: Object } {
  const startCoords = {
    lat: startPathPoints.coordinates[0][1],
    long: startPathPoints.coordinates[0][0],
  };
  const endCoords = {
    lat: endPathPoints.coordinates[endPathPoints.coordinates.length - 1][1],
    long: endPathPoints.coordinates[endPathPoints.coordinates.length - 1][0],
  };
  return { startCoords, endCoords };
}

/**
 * Returns boundingBox from a Graphhopper path
 *
 * @param startPathPoints
 * @param endPathPoints
 * @returns {Object}
 */
function generateBoundingBox(path: Object): Object {
  return {
    minLat: path.bbox[1],
    minLong: path.bbox[0],
    maxLat: path.bbox[3],
    maxLong: path.bbox[2],
  };
}

/**
 * Returns the distance between [startCoords] and [endCoords] in miles.
 * NOTE: Taken from https://www.geodatasource.com/developers/javascript
 * @param startCoords
 * @param endCoords
 * @returns {number}
 */
function getDistanceInMiles(startCoords: Object, endCoords: Object): number {
  const startLat = startCoords.lat;
  const startLong = startCoords.long;
  const endLat = endCoords.lat;
  const endLong = endCoords.long;
  if (startLat === endLat && startLong === endLong) {
    return 0;
  }

  // Convert start and end latitude to radians
  const startLatRadians = Math.PI * startLat / 180;
  const endLatRadians = Math.PI * endLat / 180;
  // Get difference of longitudes and convert to radians
  const theta = startLong - endLong;
  const thetaRadians = Math.PI * theta / 180;
  let dist = Math.sin(startLatRadians) * Math.sin(endLatRadians)
    + Math.cos(startLatRadians) * Math.cos(endLatRadians) * Math.cos(thetaRadians);
  dist = Math.min(dist, 1);
  dist = Math.acos(dist) * 180 * 60 * 1.1515 / Math.PI;
  return dist;
}

/**
 * Returns the difference between [departureTime] and [arrivalTime] in minutes.
 * @param departureTime
 * @param arrivalTime
 * @returns {number}
 */
function getDifferenceInMinutes(departureTime: string, arrivalTime: string): number {
  const departureDate = new Date(departureTime);
  const arrivalDate = new Date(arrivalTime);
  const diffInMs = arrivalDate - departureDate;
  // Need to take % of ONE_DAY_IN_MS and ONE_HOUR_IN_MS to get the current hour and minute respectively
  const diffInMins = Math.round(((diffInMs % ONE_DAY_IN_MS) % ONE_HOUR_IN_MS) / ONE_MIN_IN_MS);
  return diffInMins;
}

/**
 * Returns dateInMs in an ISO String
 *
 * @param dateInMs
 * @returns {string}
 */
function convertMillisecondsToISOString(dateInMs: number): string {
  return `${new Date(dateInMs).toISOString().split('.')[0]}Z`;
}

/**
 * Transform route object from graphhopper into one readable by the client.
 *
 * @param data
 * @param dateMs
 * @param originName
 * @param destinationName
 * @param isArriveBy
 * @returns {Object}
 */
function parseWalkingRoute(
  data: Object,
  dateMs: number,
  originName: string,
  destinationName: string,
  isArriveBy: boolean,
): Object {
  try {
    const path = data.paths[0];
    let startDateMs = dateMs;
    let endDateMs = dateMs + path.time;

    if (isArriveBy) {
      startDateMs = dateMs - path.time;
      endDateMs = dateMs;
    }
    const departureTime = convertMillisecondsToISOString(startDateMs);
    const arrivalTime = convertMillisecondsToISOString(endDateMs);
    const totalDuration = getDifferenceInMinutes(departureTime, arrivalTime);

    const { startCoords, endCoords } = getStartEndCoords(path.points, path.points);
    const travelDistance = getDistanceInMiles(startCoords, endCoords);
    const boundingBox = generateBoundingBox(path);

    const walkingPath = path.points.coordinates.map(point => ({
      lat: point[1],
      long: point[0],
    }));

    const direction = {
      delay: null,
      distance: path.distance,
      endLocation: endCoords,
      endTime: arrivalTime,
      name: destinationName,
      path: walkingPath,
      routeNumber: null,
      startLocation: startCoords,
      startTime: departureTime,
      stops: [],
      tripIdentifiers: null,
      type: DIRECTION_TYPE.WALK,
    };

    const routeSummary = [
      {
        stopName: originName,
        direction: { type: DIRECTION_TYPE.WALK },
        stayOnBusForTransfer: false,
      },
      {
        stopName: destinationName,
        direction: null,
        stayOnBusForTransfer: false,
      },
    ];

    return adjustRouteTimesIfNecessary({
      arrivalTime,
      boundingBox,
      departureTime,
      directions: [direction],
      endCoords,
      endName: destinationName,
      numberOfTransfers: 0,
      routeSummary,
      startCoords,
      startName: originName,
      totalDuration,
      travelDistance,
    });
  } catch (e) {
    throw new Error(
      LogUtils.logErr(e, { data, dateMs, destinationName }, 'Parse walking route failed'),
    );
  }
}

/**
 * Transform route object from graphhopper into one readable by the client, an array of
 * five routes. Includes delay calculations, asynchronous.
 *
 * Example return object:
 [
 {  departureTime: '2018-10-22T03:44:19Z',
    arrivalTime: '2018-10-22T04:01:46Z',
    directions: [ [Object], [Object], [Object], [Object] ],
    startCoords: { lat: 42.441603931224435, long: -76.48638788207742 },
    endCoords: { lat: 42.45662677611252, long: -76.47693624444763 },
    boundingBox:
     { minLat: 42.441596,
       minLong: -76.490387,
       maxLat: 42.456818,
       maxLong: -76.471642 },
    numberOfTransfers: 1,
  },
 ...
  ]
 * @param busRoutes
 * @param originName
 * @param destinationName
 * @returns {Promise<Array<Object>>}
 */
function parseBusRoutes(busRoutes: Array<Object>, originName: string, destinationName: string): Promise<Array<Object>> {
  return Promise.all(busRoutes.map(async (busRoute) => {
    try {
      // array containing legs of journey. e.g. walk, bus ride, walk
      const { legs } = busRoute;
      const numberOfLegs = legs.length;

      // string 2018-02-21T17:27:00Z
      const { departureTime } = legs[0];
      const arriveTime = legs[numberOfLegs - 1].arrivalTime;
      const totalDuration = getDifferenceInMinutes(departureTime, arriveTime);

      const startingLocationGeometry = legs[0].geometry;
      const endingLocationGeometry = legs[numberOfLegs - 1].geometry;

      const {
        startCoords,
        endCoords,
      } = getStartEndCoords(startingLocationGeometry, endingLocationGeometry);
      const travelDistance = getDistanceInMiles(startCoords, endCoords);
      const boundingBox = generateBoundingBox(busRoute);

      const directions = await Promise.all(legs.map(async (currLeg, j, legsArray) => {
        let { type } = currLeg;
        const startTime = currLeg.departureTime;
        const endTime = currLeg.arrivalTime;

        if (type === 'pt') {
          type = DIRECTION_TYPE.DEPART;
        }

        let name = '';
        if (type === DIRECTION_TYPE.WALK) {
          // means we are at the last direction aka a walk. name needs to equal final destination
          if (j === numberOfLegs - 1) {
            name = destinationName;
          } else {
            name = legsArray[j + 1].departureLocation;
          }
        } else if (type === DIRECTION_TYPE.DEPART) {
          name = currLeg.departureLocation;
        }

        const currCoordinates = currLeg.geometry.coordinates;
        let path = currCoordinates.map(point => ({
          lat: point[1],
          long: point[0],
        }));

        const startLocation = path[0];
        const endLocation = path[path.length - 1];
        let routeNumber = null;
        let tripID = null;
        let delay = null;
        let stops = [];
        let stayOnBusForTransfer = false;

        const { distance } = currLeg;
        if (type === DIRECTION_TYPE.DEPART) {
          if (currLeg.isInSameVehicleAsPrevious) { // last depart was a transfer
            stayOnBusForTransfer = true;
          }

          tripID = [currLeg.trip_id];

          const routeJson = await GTFSUtils.fetchRoutes();
          const route = routeJson.filter(
            routeObj => routeObj.route_id.toString() === currLeg.route_id.toString(),
          );

          path = currLeg.stops.map(stop => ({
            lat: stop.geometry.coordinates[1],
            long: stop.geometry.coordinates[0],
          }));

          if (route.length === 1) {
            // this gets the correct route number for the gtfs data
            routeNumber = route[0].route_short_name.match(/\d+/g).map(Number)[0];
          }

          if (path.length >= 2) {
            // Map Matching
            const firstStopCoords = path[0];
            const lastStopCoords = path[path.length - 1];
            const gpxJson = createGpxJson(path, startTime);
            const gpx = createGpx(gpxJson.waypoints, {
              activityName: gpxJson.activityType,
              startTime: gpxJson.startTime,
            });

            try {
              const options = {
                method: 'POST',
                url: `http://${MAP_MATCHING || 'ERROR'}:8989/match`,
                body: gpx,
                headers: { 'Content-Type': 'application/xml' },
                qs: { points_encoded: false, vehicle: 'car' },
              };

              const snappingResponseRequest = await RequestUtils.createRequest(
                options,
                'snappingResponse request failed',
              );

              let snappingResponse = null;

              if (snappingResponseRequest) {
                snappingResponse = JSON.parse(snappingResponseRequest);

                // need to handle errors more gracefully
                path = snappingResponse.paths[0].points.coordinates.map(point => ({
                  lat: point[1],
                  long: point[0],
                }));
              }
            } catch (error) {
              const undefinedGraphHopperMessage = 'undefined graphhopper mapmatching env';
              LogUtils.log({
                destinationName,
                error,
                message: `Snap response failed: ${MAP_MATCHING || undefinedGraphHopperMessage}`,
              });
            }

            // Trim Coordinates so they start/end at bus stops
            const startDistanceArray = path.map(p2 => distanceBetweenPointsMiles(firstStopCoords, p2));
            const endDistanceArray = path.map(p2 => distanceBetweenPointsMiles(lastStopCoords, p2));

            const startIndex = startDistanceArray.indexOf(Math.min(...startDistanceArray));
            const endIndex = endDistanceArray.indexOf(Math.min(...endDistanceArray));

            path = path.slice(startIndex, endIndex);
            path.unshift(firstStopCoords);
            path.push(lastStopCoords);
          }

          // create all stops array
          stops = currLeg.stops.map(stop => ({
            lat: stop.geometry.coordinates[1],
            long: stop.geometry.coordinates[0],
            name: stop.stop_name,
            stopID: stop.stop_id,
          }));

          const rtf = await RealtimeFeedUtils.fetchRTF();
          const realtimeData = RealtimeFeedUtils.getDelayInformation(stops[0].stopID, tripID[0], rtf);

          delay = (realtimeData && realtimeData.delay);
        }

        return {
          delay,
          distance,
          endLocation,
          endTime,
          name,
          path,
          routeNumber,
          startLocation,
          startTime,
          stayOnBusForTransfer,
          stops,
          tripIdentifiers: tripID,
          type,
        };
      }));

      // Create array of RouteSummaryElements. This array is provided to allow for less logic on client
      // Each RouteSummaryElement consists of {direction, stayOnBusForTransfer, stopName}.
      let previousStopName;
      const routeSummary = directions.map((direction, index) => {
        const { name, type, stayOnBusForTransfer } = direction;

        // We want to ignore the intial walking direction
        if (index === 0 && type === DIRECTION_TYPE.WALK) return null;

        const routeSummaryDirection = { busNumber: null, type };

        let stopName = name;
        if (type === DIRECTION_TYPE.DEPART) {
          routeSummaryDirection.busNumber = direction.routeNumber;
          previousStopName = direction.stops[direction.stops.length - 1].name;
        } else { // Walking direction
          // If we've already arrived at the destination, then we can ignore this walking direction.
          if (previousStopName === destinationName) return null;
          // stopName should be the name of the stop we just got off
          stopName = previousStopName;
        }

        return {
          direction: routeSummaryDirection,
          stayOnBusForTransfer,
          stopName,
        };
      }).filter(Boolean);

      // The last element in routeSummary should be an object representing arriving to destination
      routeSummary.push({
        direction: null,
        stayOnBusForTransfer: false,
        stopName: destinationName,
      });

      return {
        arrivalTime: arriveTime,
        boundingBox,
        departureTime,
        directions,
        endCoords,
        endName: destinationName,
        numberOfTransfers: busRoute.transfers,
        routeSummary,
        startCoords,
        startName: originName,
        totalDuration,
        travelDistance,
      };
    } catch (error) {
      throw new Error(
        LogUtils.logErr(error, busRoutes.length, 'Parse final route failed'),
      );
    }
  }));
}

export default {
  condenseRoute,
  parseBusRoutes,
  parseWalkingRoute,
};
