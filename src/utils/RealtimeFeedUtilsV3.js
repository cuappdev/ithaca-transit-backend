import fetch from "node-fetch";
import { fileURLToPath } from "url";
import protobuf from "protobufjs";
import path from "path";

const RTF_URL =
  "https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate";

let rtfData = null;

// Load and compile the gtfs-realtime.proto file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = protobuf.loadSync(
  path.join(__dirname, "..", "..", "gtfs", "gtfs-realtime.proto")
);
const FeedMessage = root.lookupType("transit_realtime.FeedMessage");

async function parseProtobuf(buffer) {
  const feed = FeedMessage.decode(buffer);
  const entityDict = {};

  feed.entity.forEach((entity) => {
    if (entity.tripUpdate) {
      const vehicleId = entity.tripUpdate.vehicle
        ? entity.tripUpdate.vehicle.id
        : null;
      const routeId = entity.tripUpdate.trip.routeId;
      const stopUpdates = {};

      entity.tripUpdate.stopTimeUpdate.forEach((stopUpdate) => {
        if (stopUpdate.scheduleRelationship !== "NO_DATA") {
          stopUpdates[stopUpdate.stopId] = stopUpdate.arrival.delay;
        }
      });

      entityDict[entity.id] = {
        routeId: routeId,
        stopUpdates: stopUpdates,
        vehicleId: vehicleId,
      };
    }
  });

  return entityDict;
}

async function fetchRTF() {
  try {
    const response = await fetch(RTF_URL);
    const buffer = await response.buffer();
    rtfData = await parseProtobuf(buffer);
  } catch (error) {
    console.error(error);
  }
}

function getRTFData() {
  return rtfData;
}

import { PYTHON_APP } from "./EnvUtils.js";
import Constants from "./Constants.js";
import LogUtils from "./LogUtils.js";
import RequestUtils from "./RequestUtils.js";

async function fetchVehicles() {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || "localhost"}:5000/vehicles`,
  };
  const data = await RequestUtils.createRequest(
    options,
    "Vehicles request failed"
  );
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
async function getTrackingResponse(requestData) {
  LogUtils.log({ message: "getTrackingResponse: entering function" });
  const vehicles = await fetchVehicles();

  const trackingInformation = requestData
    .map((data) => {
      const { routeId, tripId } = data;
      const vehicleData = getVehicleInformation(routeId, tripId, vehicles);
      if (!vehicleData) {
        LogUtils.log({ message: "getVehicleResponse: noData", vehicleData });
        return null;
      }
      return vehicleData;
    })
    .filter(Boolean);

  return trackingInformation;
}

/**
 * Returns a { vehicleID, delay } object
 * @param stopId
 * @param tripId
 * @param rtf
 * @returns Object
 */
function getDelayInformation(stopId, tripId, rtf) {
  // rtf param ensures the realtimeFeed doesn't update in the middle of execution
  // if invalid params or the trip is inactive
  if (!stopId || !tripId || !rtf || !rtf[tripId]) {
    LogUtils.log({
      category: "getDelayInformation NULL",
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
function getVehicleInformation(routeId, tripId, vehicles) {
  // vehicles param ensures the vehicle tracking information doesn't update in
  // the middle of execution
  if (!routeId || !tripId || !vehicles) {
    LogUtils.log({
      category: "getVehicleInformation NULL",
      routeId,
      tripId,
    });
    return null;
  }
  const vehicleData = Object.values(vehicles).find(
    // Naming here is routeID and tripID due to how the microservice names fields
    (v) => v.routeID === routeId && v.tripID === tripId
  );
  if (!vehicleData) {
    LogUtils.log({
      category: "getVehicleInformation no data",
      routeId,
      tripId,
    });
    return {
      case: "noData",
      latitude: 0,
      longitude: 0,
      routeId,
      vehicleId: 0,
    };
  }
  return {
    case: "validData",
    latitude: vehicleData.latitude,
    longitude: vehicleData.longitude,
    routeId,
    vehicleId: vehicleData.vehicleID,
  };
}

export default {
  getRTFData,
  fetchVehicles,
  getDelayInformation,
  getVehicleInformation,
  getTrackingResponse,
};
