function createGpx(waypoints, options = {}) {
  const { activityName = "GPX Route", startTime = new Date().toISOString() } =
    options;

  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="gps-to-gpx">
  <metadata>
    <name>${activityName}</name>
    <time>${startTime}</time>
  </metadata>
  <trk>
    <name>${activityName}</name>
    <trkseg>`;

  const gpxWaypoints = waypoints
    .map(
      (wp) => `
      <trkpt lat="${wp.latitude}" lon="${wp.longitude}">
        ${wp.elevation ? `<ele>${wp.elevation}</ele>` : ""}
        ${wp.time ? `<time>${wp.time}</time>` : ""}
      </trkpt>`
    )
    .join("");

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return `${gpxHeader}${gpxWaypoints}${gpxFooter}`;
}

import { isNullOrUndefined } from "util";
import { GHOPPER } from "./EnvUtils.js";
import AllStopUtils from "./AllStopUtils.js";
import GTFSUtils from "./GTFSUtils.js";
import LogUtils from "./LogUtils.js";
import RealtimeFeedUtils from "./RealtimeFeedUtilsV3.js";
import RequestUtils from "./RequestUtils.js";

const DIRECTION_TYPE = {
  DEPART: "depart",
  WALK: "walk",
};
const ONE_DAY_IN_MS = 86400000;
const ONE_HOUR_IN_MS = 3600000;
const ONE_MIN_IN_MS = 60000;

/**
 * distanceBetweenPoints(point1, point2) returns the distance between two points in miles
 * using the Haversine formula
 */
function distanceBetweenPointsMiles(point1, point2) {
  const radlat1 = (Math.PI * point1.lat) / 180;
  const radlat2 = (Math.PI * point2.lat) / 180;
  const theta = point1.long - point2.long;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist;
}

function createGpxJson(stops, startTime) {
  const waypoints = stops.map((stop) => ({
    latitude: stop.lat,
    longitude: stop.long,
    elevation: 0,
    time: startTime,
  }));
  return {
    activityType: "GraphHopper Track",
    startTime,
    waypoints,
  };
}

/**
 * Merge two directions
 * @param first
 * @param second
 * @returns {{type: *, name: *, startTime: *, endTime: *,
 * startLocation: ({lat: *, long: *}|*),
 * endLocation: ({lat: *, long: *}|*),
 * path: T[] | string | *, distance: *,
 * routeId: (null|*), stops: T[], tripIds: T[] | string | *}}
 */
function mergeDirections(first, second) {
  second.stops.shift();
  second.path.shift();

  const path = first.path.concat(second.path);
  const distance = first.distance + second.distance;
  const stops = first.stops.concat(second.stops);
  const tripIds = first.tripIds.concat(second.tripIds);

  // The combined delay is only the first bus route's delay, because that is
  // how much the combined route is initially delayed by and is what the user
  // needs to know in order to board the route on time.
  const delay = isNullOrUndefined(first.delay) ? null : first.delay;

  // If there is any part of the bus route that a passenger does not stay on for
  // transfer, then the passenger has to get off the bus at some point, so
  // stayOnBusForTransfer is false if either route's stayOnBusForTransfer is false.
  const firstStayOnBusForTransfer = isNullOrUndefined(
    first.stayOnBusForTransfer
  )
    ? false
    : first.stayOnBusForTransfer;
  const secondStayOnBusForTransfer = isNullOrUndefined(
    second.stayOnBusForTransfer
  )
    ? false
    : second.stayOnBusForTransfer;
  const stayOnBusForTransfer =
    firstStayOnBusForTransfer && secondStayOnBusForTransfer;

  return {
    delay,
    distance,
    endLocation: second.endLocation,
    endTime: second.endTime,
    name: first.name,
    path,
    routeId: first.routeId,
    startLocation: first.startLocation,
    startTime: first.startTime,
    stayOnBusForTransfer,
    stops,
    tripIds,
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
      AllStopUtils.DEG_WALK_PRECISION
    );

    if (startLocIsStop) {
      route.directions.shift();
    }
  }

  if (
    route.directions[route.directions.length - 1].distance <
    minWalkingDirDistanceMeters
  ) {
    const endLocIsStop = await AllStopUtils.isStopsWithinPrecision(
      endCoords,
      AllStopUtils.DEG_WALK_PRECISION
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
  route,
  startCoords,
  endCoords,
  maxWalkingDistance,
  departureDelayBuffer,
  departureTimeNowMs
) {
  await trimFirstLastDirections(route, startCoords, endCoords);

  let previousDirection = null;
  let totalDistanceWalking = 0;

  for (let index = 0; index < route.directions.length; index++) {
    const direction = route.directions[index];
    const startTime = Date.parse(direction.startTime);
    const endTime = Date.parse(direction.endTime);

    // Discard routes with directions that take over 2 hours time
    if (startTime + ONE_HOUR_IN_MS * 2 <= endTime) {
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
      // direction.delay could be undefined, NaN, or null
      const delayMs = direction.delay ? direction.delay * 1000 : 0;
      if (startTime < departureTimeNowMs - ONE_MIN_IN_MS - delayMs) {
        return null;
      }
    }

    if (
      previousDirection &&
      previousDirection.type === DIRECTION_TYPE.DEPART &&
      direction.type === DIRECTION_TYPE.DEPART
    ) {
      /*
       * Discard route if a depart direction's last stopId is not equal to the next direction's first stopId,
       * Fixes bug where graphhopper directions are to get off at a stop and get on another stop
       * far away with no walking direction in between, EG: 1. get off at Statler 2. board at RPCC
       */
      if (
        previousDirection.stops[previousDirection.stops.length - 1].stopId !==
        direction.stops[0].stopId
      ) {
        return null;
      }

      /*
       * If consecutive bus directions have the same routeId,
       * then replace the last direction with merged directions and remove the current direction.
       * No real transfer, probably just change in trip_ids.
       */
      if (previousDirection.routeId === direction.routeId) {
        route.directions.splice(
          index - 1,
          2,
          mergeDirections(previousDirection, direction)
        );
        index -= 1; // since we removed an element from the array
      }

      // Discard routes with over 1 hours time waiting between each direction

      const prevEndTime = Date.parse(previousDirection.endTime);
      if (prevEndTime + ONE_HOUR_IN_MS < startTime) {
        return null;
      }
    }

    if (direction.type === DIRECTION_TYPE.WALK) {
      totalDistanceWalking += direction.distance;
    }
    previousDirection = direction;
  }

  // if a bus route has more walking distance than the walking route, discard route
  // or route has 0 directions
  if (
    totalDistanceWalking > maxWalkingDistance ||
    route.directions.length === 0
  ) {
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
function adjustRouteTimesIfNecessary(route) {
  const departureDate = new Date(route.departureTime);
  const arrivalDate = new Date(route.arrivalTime);

  const isWithinMinute =
    departureDate.getTime() + ONE_MIN_IN_MS > arrivalDate.getTime();
  const isSameMinute = departureDate.getMinutes() === arrivalDate.getMinutes();

  if (isWithinMinute && isSameMinute) {
    route.arrivalTime = convertMillisecondsToISOString(
      arrivalDate.getTime() + ONE_MIN_IN_MS
    );
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
function getStartEndCoords(startPathPoints, endPathPoints) {
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
function generateBoundingBox(path) {
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
function getDistanceInMiles(startCoords, endCoords) {
  const startLat = startCoords.lat;
  const startLong = startCoords.long;
  const endLat = endCoords.lat;
  const endLong = endCoords.long;
  if (startLat === endLat && startLong === endLong) {
    return 0;
  }

  // Convert start and end latitude to radians
  const startLatRadians = (Math.PI * startLat) / 180;
  const endLatRadians = (Math.PI * endLat) / 180;
  // Get difference of longitudes and convert to radians
  const theta = startLong - endLong;
  const thetaRadians = (Math.PI * theta) / 180;
  let dist =
    Math.sin(startLatRadians) * Math.sin(endLatRadians) +
    Math.cos(startLatRadians) *
      Math.cos(endLatRadians) *
      Math.cos(thetaRadians);
  dist = Math.min(dist, 1);
  dist = (Math.acos(dist) * 180 * 60 * 1.1515) / Math.PI;
  return dist;
}

/**
 * Returns the difference between [departureTime] and [arrivalTime] in minutes.
 * @param departureTime
 * @param arrivalTime
 * @returns {number}
 */
function getDifferenceInMinutes(departureTime, arrivalTime) {
  const departureDate = new Date(departureTime);
  const arrivalDate = new Date(arrivalTime);
  const diffInMs = arrivalDate - departureDate;
  // Need to take % of ONE_DAY_IN_MS and ONE_HOUR_IN_MS to get the current hour and minute respectively
  const diffInMins = Math.round(
    ((diffInMs % ONE_DAY_IN_MS) % ONE_HOUR_IN_MS) / ONE_MIN_IN_MS
  );
  return diffInMins;
}

/**
 * Returns dateInMs in an ISO String
 *
 * @param dateInMs
 * @returns {string}
 */
function convertMillisecondsToISOString(dateInMs) {
  return `${new Date(dateInMs).toISOString().split(".")[0]}Z`;
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
  data,
  dateMs,
  originName,
  destinationName,
  isArriveBy
) {
  try {
    const path = data.paths[0];
    let startTimeMs = dateMs;
    let endTimeMs = dateMs + path.time;

    if (isArriveBy) {
      startTimeMs = dateMs - path.time;
      endTimeMs = dateMs;
    }
    const departureTime = convertMillisecondsToISOString(startTimeMs);
    const arrivalTime = convertMillisecondsToISOString(endTimeMs);
    const totalDuration = getDifferenceInMinutes(departureTime, arrivalTime);

    const { startCoords, endCoords } = getStartEndCoords(
      path.points,
      path.points
    );
    const travelDistance = getDistanceInMiles(startCoords, endCoords);
    const boundingBox = generateBoundingBox(path);

    const walkingPath = path.points.coordinates.map((point) => ({
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
      routeId: null,
      startLocation: startCoords,
      startTime: departureTime,
      stops: [],
      tripIds: null,
      type: DIRECTION_TYPE.WALK,
    };

    return adjustRouteTimesIfNecessary({
      arrivalTime,
      boundingBox,
      departureTime,
      directions: [direction],
      endCoords,
      endName: destinationName,
      numberOfTransfers: 0,
      startCoords,
      startName: originName,
      totalDuration,
      travelDistance,
    });
  } catch (e) {
    throw new Error(
      LogUtils.logErr(
        e,
        { data, dateMs, destinationName },
        "Parse walking route failed"
      )
    );
  }
}

/**
 * Ensure that the route times are in this format: "2020-08-27T23:11:58Z".
 * Sometimes, we will get dates in the format of "2020-08-27T23:11:58.741+0000"
 * and if this is the case, strip the milliseconds off. Otherwise, return the
 * date we were given.
 * @param date
 * @returns formatted date string
 */
function formatDate(date) {
  if (date) {
    const dateBeforeMs = date.split(".")[0];
    if (date === dateBeforeMs) {
      // date already does not have milliseconds
      return date;
    }
    return `${dateBeforeMs}Z`;
  }
  return date;
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
function parseRoutes(
  busRoutes,
  originName,
  destinationName,
  originalDepartureTimeMs,
  isArriveByQuery
) {
  try {
    return Promise.all(
      busRoutes.map(async (busRoute) => {
        // array containing legs of journey. e.g. walk, bus ride, walk
        const { legs } = busRoute;
        const numberOfLegs = legs.length;

        // string 2018-02-21T17:27:00Z
        let { departureTime } = legs[0];
        departureTime = formatDate(departureTime);
        let arriveTime = formatDate(legs[numberOfLegs - 1].arrivalTime);

        // Readjust the walking start and end times by accounting for the buffer
        // times that were initially passed into Graphhopper to get routes
        if (busRoute.transfers === -1) {
          let startTimeMs = originalDepartureTimeMs;
          let endTimeMs = originalDepartureTimeMs + busRoute.time;
          if (isArriveByQuery) {
            startTimeMs = originalDepartureTimeMs - busRoute.time;
            endTimeMs = originalDepartureTimeMs;
          }
          departureTime = convertMillisecondsToISOString(startTimeMs);
          arriveTime = convertMillisecondsToISOString(endTimeMs);
        }
        const totalDuration = getDifferenceInMinutes(departureTime, arriveTime);

        const startingLocationGeometry = legs[0].geometry;
        const endingLocationGeometry = legs[numberOfLegs - 1].geometry;

        const { startCoords, endCoords } = getStartEndCoords(
          startingLocationGeometry,
          endingLocationGeometry
        );
        const travelDistance = getDistanceInMiles(startCoords, endCoords);
        const boundingBox = generateBoundingBox(busRoute);

        const directions = await Promise.all(
          legs.map(async (currLeg, j, legsArray) => {
            let { type } = currLeg;
            let startTime = formatDate(currLeg.departureTime);
            let endTime = formatDate(currLeg.arrivalTime);

            if (busRoute.transfers === -1) {
              startTime = departureTime;
              endTime = arriveTime;
            }

            if (type === "pt") {
              type = DIRECTION_TYPE.DEPART;
            }

            let name = "";
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
            let path = currCoordinates.map((point) => ({
              lat: point[1],
              long: point[0],
            }));

            const startLocation = path[0];
            const endLocation = path[path.length - 1];
            let routeId = null;
            let tripId = null;
            let delay = null;
            let stops = [];
            let stayOnBusForTransfer = false;

            const { distance } = currLeg;
            if (type === DIRECTION_TYPE.DEPART) {
              if (currLeg.isInSameVehicleAsPrevious) {
                // last depart was a transfer
                stayOnBusForTransfer = true;
              }

              tripId = [currLeg.trip_id];

              const routeJson = await GTFSUtils.getGTFSData();
              const route = routeJson.filter(
                (routeObj) =>
                  routeObj.route_id.toString() === currLeg.route_id.toString()
              );

              path = currLeg.stops.map((stop) => ({
                lat: stop.geometry.coordinates[1],
                long: stop.geometry.coordinates[0],
              }));

              if (route.length === 1) {
                // this gets the correct route number for the gtfs data
                routeId = route[0].route_short_name
                  .match(/\d+/g)
                  .map(Number)[0];
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
                    method: "POST",
                    url: `http://${GHOPPER || "ERROR"}:8989/match`,
                    body: gpx,
                    headers: { "Content-Type": "application/xml" },
                    qs: { points_encoded: false, vehicle: "car" },
                  };

                  const snappingResponseRequest =
                    await RequestUtils.createRequest(
                      options,
                      "snappingResponse request failed"
                    );

                  let snappingResponse = null;

                  if (snappingResponseRequest) {
                    snappingResponse = JSON.parse(snappingResponseRequest);

                    // need to handle errors more gracefully
                    path = snappingResponse.paths[0].points.coordinates.map(
                      (point) => ({
                        lat: point[1],
                        long: point[0],
                      })
                    );
                  }
                } catch (error) {
                  const undefinedGraphHopperMessage =
                    "undefined graphhopper mapmatching env";
                  LogUtils.log({
                    destinationName,
                    error,
                    message: `Snap response failed: ${
                      GHOPPER || undefinedGraphHopperMessage
                    }`,
                  });
                }

                // Trim Coordinates so they start/end at bus stops
                const startDistanceArray = path.map((p2) =>
                  distanceBetweenPointsMiles(firstStopCoords, p2)
                );
                const endDistanceArray = path.map((p2) =>
                  distanceBetweenPointsMiles(lastStopCoords, p2)
                );

                const startIndex = startDistanceArray.indexOf(
                  Math.min(...startDistanceArray)
                );
                const endIndex = endDistanceArray.indexOf(
                  Math.min(...endDistanceArray)
                );

                path = path.slice(startIndex, endIndex);
                path.unshift(firstStopCoords);
                path.push(lastStopCoords);
              }

              // create all stops array
              stops = currLeg.stops.map((stop) => ({
                lat: stop.geometry.coordinates[1],
                long: stop.geometry.coordinates[0],
                name: stop.stop_name,
                stopId: stop.stop_id,
              }));

              const rtf = await RealtimeFeedUtils.getRTFData();
              const realtimeData = RealtimeFeedUtils.getDelayInformation(
                stops[0].stopId,
                tripId[0],
                rtf
              );

              delay = realtimeData && realtimeData.delay;
            }

            return {
              delay,
              distance,
              endLocation,
              endTime,
              name,
              path,
              routeId,
              startLocation,
              startTime,
              stayOnBusForTransfer,
              stops,
              tripIds: tripId || [],
              type,
            };
          })
        );

        return {
          arrivalTime: arriveTime,
          boundingBox,
          departureTime,
          directions,
          endCoords,
          endName: destinationName,
          numberOfTransfers: busRoute.transfers,
          startCoords,
          startName: originName,
          totalDuration,
          travelDistance,
        };
      })
    );
  } catch (error) {
    throw new Error(
      LogUtils.logErr(error, busRoutes.length, "Parse final route failed")
    );
  }
}

export default {
  condenseRoute,
  distanceBetweenPointsMiles,
  parseRoutes,
  parseWalkingRoute,
};
