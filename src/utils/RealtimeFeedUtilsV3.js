import fetch from "node-fetch";
import { fileURLToPath } from "url";
import protobuf from "protobufjs";
import path from "path";
import LogUtils from "./LogUtils.js";

const RTF_URL =
  "https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=TripUpdate";
const VEHICLES_URL =
  "https://realtimetcatbus.availtec.com/InfoPoint/GTFS-Realtime.ashx?&Type=VehiclePosition&serverid=0";

let rtfData = null;
let vehicleData = null;

// Load and compile the gtfs-realtime.proto file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = protobuf.loadSync(
  path.join(__dirname, "..", "..", "gtfs", "gtfs-realtime.proto")
);
const FeedMessage = root.lookupType("transit_realtime.FeedMessage");

async function parseProtobufRTF(buffer) {
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
        if (
          stopUpdate.scheduleRelationship !== "NO_DATA" &&
          stopUpdate.arrival
        ) {
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
    rtfData = await parseProtobufRTF(buffer);
  } catch (error) {
    console.error(error);
  }
}

function getRTFData() {
  return rtfData;
}

async function parseProtobufVehicles(buffer) {
  const feed = FeedMessage.decode(buffer);
  const entityDict = {};

  feed.entity.forEach((entity) => {
    if (entity.vehicle) {
      const vehicleId = entity.id;
      const congestionLevel = entity.vehicle.congestionLevel;
      const currentStatus = entity.vehicle.currentStatus;
      const currentStopSequence = entity.vehicle.currentStopSequence;
      const occupancyStatus = entity.vehicle.occupancyStatus;
      const stopId = entity.vehicle.stopId;
      const timestamp = entity.vehicle.timestamp;
      let routeId = null;
      let tripId = null;
      let bearing = null;
      let latitude = null;
      let longitude = null;
      let speed = null;

      if (entity.vehicle.trip) {
        routeId = entity.vehicle.trip.routeId;
        tripId = entity.vehicle.trip.tripId;
      }

      if (entity.vehicle.position) {
        bearing = entity.vehicle.position.bearing;
        latitude = entity.vehicle.position.latitude;
        longitude = entity.vehicle.position.longitude;
        speed = entity.vehicle.position.speed;
      }

      entityDict[vehicleId] = {
        bearing: bearing,
        congestionLevel: congestionLevel,
        currentStatus: currentStatus,
        currentStopSequence: currentStopSequence,
        latitude: latitude,
        longitude: longitude,
        occupancyStatus: occupancyStatus,
        routeId: routeId,
        speed: speed,
        stopId: stopId,
        timestamp: timestamp,
        tripId: tripId,
        vehicleId: vehicleId,
      };
    }
  });
  return entityDict;
}

async function fetchVehicles() {
  try {
    const response = await fetch(VEHICLES_URL);
    const buffer = await response.buffer();
    vehicleData = await parseProtobufVehicles(buffer);
  } catch (error) {
    console.error(error);
  }
}

function getVehicleData() {
  return vehicleData;
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
  const vehicles = getVehicleData();

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
    (v) => v.routeId === routeId && v.tripId === tripId
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
  fetchRTF,
  getVehicleData,
  fetchVehicles,
  getDelayInformation,
  getVehicleInformation,
  getTrackingResponse,
};
