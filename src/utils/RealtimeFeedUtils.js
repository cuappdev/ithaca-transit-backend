// @flow
import { PYTHON_APP } from './EnvUtils';
import Constants from './Constants';
import LogUtils from './LogUtils';
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';

async function fetchRTF(): Object {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/rtf`,
  };
  const data = await RequestUtils.createRequest(options, 'Tracking request failed');
  return JSON.parse(data);
}

/**
 * Given an array of { stopID, routeID, [tripID] },
 * Return bus and tracking data including location
 * Input:
 [
 {
   “stopID” : String,
   “routeID” : String,
   “tripIdentifiers” : [String]
 },
 …
 ]
 */
async function getTrackingResponse(requestData: Object): Object {
  LogUtils.log({ message: 'getTrackingResponse: entering function' });

  const trackingInformation = [];
  const rtf = await fetchRTF(); // ensures the realtimeFeed doesn't update in the middle of execution

  // for each input
  await Promise.all(requestData.map(async (data): Promise<boolean> => {
    const { stopID, routeID, tripIdentifiers } = data;
    const realtimeDelayData = getDelayInformation(stopID, tripIdentifiers[0], rtf);

    if (realtimeDelayData) {
      const authHeader = await TokenUtils.fetchAuthHeader();
      const options = {
        method: 'GET',
        url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Vehicles/GetAllVehiclesForRoute',
        headers: {
          Authorization: authHeader,
          'Cache-Control': 'no-cache',
          'Postman-Token': 'b688b636-87ea-4e04-9f3e-ba34e811e639',
        },
        qs: { routeID },
      };

      const trackingRequest = await RequestUtils.createRequest(options, 'Tracking request failed');
      if (!trackingRequest) return false;

      /**
       * Parse request to object and map valid realtime data to info for each bus
       */
      const busFound = JSON.parse(trackingRequest) // parse the request
        .find( // find the first tracking data matching the vehicleId
          busInfo => busInfo.VehicleId === realtimeDelayData.vehicleId,
        );

      if (!busFound) return false;

      const trackingData = ((busInfo) => { // create object and return
        let lastUpdated = busInfo.LastUpdated;
        const firstParan = lastUpdated.indexOf('(') + 1;
        const secondParan = lastUpdated.indexOf('-');
        lastUpdated = parseInt(lastUpdated.slice(firstParan, secondParan));
        return {
          case: 'validData',
          commStatus: busInfo.CommStatus,
          delay: realtimeDelayData.delay,
          destination: busInfo.Destination,
          deviation: busInfo.Deviation,
          direction: busInfo.Direction,
          displayStatus: busInfo.DisplayStatus,
          gpsStatus: busInfo.GPSStatus,
          heading: busInfo.Heading,
          lastStop: busInfo.LastStop,
          lastUpdated,
          latitude: busInfo.Latitude,
          longitude: busInfo.Longitude,
          name: busInfo.Name,
          opStatus: busInfo.OpStatus,
          routeID: busInfo.RouteId,
          runID: busInfo.RunId,
          speed: busInfo.Speed,
          tripID: busInfo.TripId,
          vehicleID: busInfo.VehicleId,
        };
      })(busFound);

      LogUtils.log({ message: 'getTrackingResponse: validData', trackingData });

      // we have tracking data for the bus
      if (trackingData) {
        trackingInformation.push(trackingData);
      } else {
        return false;
      }
      return true;
    }
    return false;
  })).catch((err) => {
    LogUtils.logErr(err, requestData, 'Tracking error');
    throw err;
  });

  if (trackingInformation.length > 0) {
    return trackingInformation;
  }

  LogUtils.log({ message: 'getTrackingResponse: noData', trackingInformation });
  // TODO: change this to non-dummy data once client fix is out
  return [{
    case: 'noData',
    commStatus: '',
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
    routeID: parseInt(requestData[0].routeID),
    runID: 0,
    speed: 0,
    tripID: 0,
    vehicleID: 0,
  }];
}

/**
 * Returns a { vehicleID, delay } object
 * @param stopID
 * @param tripID
 * @param rtf
 * @returns Object
 */
function getDelayInformation(stopID: String, tripID: String, rtf: Object): ?Object {
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

export default {
  fetchRTF,
  getDelayInformation,
  getTrackingResponse,
};
