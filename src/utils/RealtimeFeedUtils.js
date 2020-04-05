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
 * Given an array of { routeID, tripID },
 * Return bus information
 * Input:
 [
 {
   “routeID” : String,
   tripID : String
 },
 …
 ]
 */
async function getTrackingResponse(requestData: Object): Object {
  LogUtils.log({ message: 'getTrackingResponse: entering function' });
  const vehicles = await fetchVehicles();
  console.log('vehicles', vehicles);

  const trackingInformation = requestData.map((data) => {
    const { routeID, tripID } = data;
    const vehicleData = getVehicleInformation(routeID, tripID, vehicles);
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
 * @param stopID
 * @param tripID
 * @param rtf
 * @returns Object
 */
function getDelayInformation(
  stopID: ?String,
  tripID: ?String,
  rtf: ?Object,
): ?Object {
  // rtf param ensures the realtimeFeed doesn't update in the middle of execution
  // if invalid params or the trip is inactive
  if (!stopID
    || !tripID
    || !rtf
    || rtf === {}
    || !rtf[tripID]) {
    LogUtils.log({
      category: 'getDelayInformation NULL',
      stopID,
      tripID,
    });
    return null;
  }

  const info = rtf[tripID];
  let delay = parseInt(info.stopUpdates && info.stopUpdates[stopID]);
  if (Number.isNaN(delay)) delay = parseInt(info.delay);

  return {
    delay,
    vehicleId: parseInt(info.vehicleId),
  };
}

function getVehicleInformation(
  routeID: ?String,
  tripID: ?String,
  vehicles: ?Object,
): ?Object {
  // vehicles param ensures the vehicle tracking information doesn't update in
  // the middle of execution
  if (!routeID
    || !tripID
    || !vehicles
    || vehicles === {}) {
    LogUtils.log({
      category: 'getVehicleInformation NULL',
      routeID,
      tripID,
    });
    return null;
  }

  return Object.values(vehicles).find(v => v.routeID === routeID && v.tripID === tripID);
}

export default {
  fetchRTF,
  fetchVehicles,
  getDelayInformation,
  getVehicleInformation,
  getTrackingResponse,
};
