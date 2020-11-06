// @flow
import { PYTHON_APP } from './EnvUtils';
import Constants from './Constants';
import LogUtils from './LogUtils';
import RequestUtils from './RequestUtils';

async function fetchRTF(): Object {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/rtf`,
  };
  const data = await RequestUtils.createRequest(options, 'RTF request failed');
  return JSON.parse(data);
}

async function fetchVehicles(): Object {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/vehicles`,
  };
  const data = await RequestUtils.createRequest(options, 'Vehicles request failed');
  return JSON.parse(data);
}

/**
 * Given an array of { routeId, tripId },
 * Return bus information
 * Input:[
 * {
 * routeId : String,
 * tripId : String
 * },... ]
 * Corresponds to GTFS RouteId and TripId.
 *
 *
 */
async function getTrackingResponse(requestData: Object): Object {
  LogUtils.log({ message: 'getTrackingResponse: entering function' });
  const vehicles = await fetchVehicles();

  const trackingInformation = requestData.map((data) => {
    const { routeId, tripId } = data;
    const vehicleData = getVehicleInformation(routeId, tripId, vehicles);
    if (!vehicleData) {
      LogUtils.log({ message: 'getVehicleResponse: noData', vehicleData });
      return null;
    }
    return vehicleData;
  }).filter(Boolean);

  return trackingInformation;
}

/**
 * Returns a { vehicleID, delay } object
 * @param stopId
 * @param tripId
 * @param rtf
 * @returns Object
 */
function getDelayInformation(
  stopId: ?String,
  tripId: ?String,
  rtf: ?Object,
): ?Object {
  // rtf param ensures the realtimeFeed doesn't update in the middle of execution
  // if invalid params or the trip is inactive
  if (!stopId
    || !tripId
    || !rtf
    || rtf === {}
    || !rtf[tripId]) {
    LogUtils.log({
      category: 'getDelayInformation NULL',
      stopId,
      tripId,
    });
    return null;
  }

  const info = rtf[tripId];
  let delay = parseInt(info.stopUpdates && info.stopUpdates[stopId]);
  if (Number.isNaN(delay)) delay = parseInt(info.delay);

  return {
    delay,
    vehicleId: parseInt(info.vehicleId),
  };
}

/**
 *
 * @param {*} routeId
 * @param {*} tripId
 * @param {*} vehicles
 */
function getVehicleInformation(
  routeId: ?String,
  tripId: ?String,
  vehicles: ?Object,
): ?Object {
  // vehicles param ensures the vehicle tracking information doesn't update in
  // the middle of execution
  if (!routeId
    || !tripId
    || !vehicles
    || vehicles === {}) {
    LogUtils.log({
      category: 'getVehicleInformation NULL',
      routeId,
      tripId,
    });
    return null;
  }
  const vehicleData = Object.values(vehicles).find(
    // Naming here is routeID and tripID due how the microservice names fields
    v => (v.routeID === routeId) && (v.tripID === tripId),
  );
  if (!vehicleData) {
    LogUtils.log({
      category: 'getVehicleInformation no data',
      routeId,
      tripId,
    });
    return {
      case: 'noData',
      latitude: 0,
      longitude: 0,
      routeId,
      vehicleId: 0,
    };
  }
  return {
    case: 'validData',
    latitude: vehicleData.latitude,
    longitude: vehicleData.longitude,
    routeId,
    vehicleId: vehicleData.vehicleID,
  };
}

export default {
  fetchRTF,
  fetchVehicles,
  getDelayInformation,
  getVehicleInformation,
  getTrackingResponse,
};
