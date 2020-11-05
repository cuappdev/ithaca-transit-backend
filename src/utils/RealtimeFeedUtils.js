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
 * We want to format the old data:
 * [
 *  {
 *   "stopId": "523",
 *   "routeId": "15",
 *   "tripIdentifiers": ["t607-b29-s1C"]
 *  },
 *  ...
 * ]
 * into the new data format type:
 * [
 *  {
 *   "routeId" : String,
 *   "tripId" : String
 *  },
 *  ...
 * ]
 * @param {*} requestData
 */
function formatOldRequestData(requestData: Object): Object {
  // don't format requests that follow the new format
  if (requestData == null || !('tripIdentifiers' in requestData[0])) {
    return requestData;
  }
  const formattedData = requestData.map((data) => {
    const { routeId } = data;
    const { tripIdentifiers } = data;
    return tripIdentifiers.map(tripId => ({ routeId, tripId }));
  });
  // flatten the data so that we don't have nested arrays
  return Array.prototype.concat.apply([], formattedData);
}

/**
 * Given an array of { routeId, tripId },
 * Return bus information
 * Input:[
 * {
 * routeId : String,
 * tripId : String
 * },... ]
 * NOTE: Because we need to provide backwards compatibility with old iOS clients
 * we have to follow their janky way of routeId input is String but routeId
 * output is Number. This "routeId" is also named jankily, which is supposed to
 * be routeNumber from v2/route/. We cast this to Number in getVehicleInformation.
 *
 *
 */
async function getTrackingResponse(requestData: Object): Object {
  const formattedData = formatOldRequestData(requestData);
  LogUtils.log({ message: 'getTrackingResponse: entering function' });
  const vehicles = await fetchVehicles();

  const trackingInformation = formattedData.map((data) => {
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
    v => (v.routeId === routeId) && (v.tripId === tripId),
  );
  if (!vehicleData) {
    LogUtils.log({
      category: 'getVehicleInformation no data',
      routeId,
      tripId,
    });
    return {
      case: 'noData',
      delay: 0,
      destination: '',
      deviation: 0,
      direction: '',
      displayStatus: '',
      gpsStatus: 0,
      heading: 0,
      lastStop: '',
      lastUpdated: 0,
      latitude: 0,
      longitude: 0,
      name: '',
      opStatus: '',
      routeId: Number(routeId), // although input is string, old clients expect a number
      runID: 0,
      speed: 0,
      tripId: 0,
      vehicleID: 0,
      congestionLevel: 0,
    };
  }
  return {
    case: 'validData',
    delay: 0,
    destination: '',
    deviation: 0,
    direction: '',
    displayStatus: '',
    gpsStatus: 0,
    heading: vehicleData.bearing,
    lastStop: '',
    lastUpdated: vehicleData.timestamp,
    latitude: vehicleData.latitude,
    longitude: vehicleData.longitude,
    name: '',
    opStatus: '',
    routeId: Number(routeId), // although input is string, old clients expect a number
    runID: 0,
    speed: parseInt(vehicleData.speed),
    tripId: 0,
    vehicleID: Number(vehicleData.vehicleID),
    congestionLevel: vehicleData.congestionLevel,
  };
}

export default {
  fetchRTF,
  fetchVehicles,
  getDelayInformation,
  getVehicleInformation,
  getTrackingResponse,
};
