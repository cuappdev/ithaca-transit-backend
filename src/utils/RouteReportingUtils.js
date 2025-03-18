import LogUtils from "./LogUtils.js";
import RealtimeFeedUtilsV3 from "./RealtimeFeedUtilsV3.js";
import ParseRouteUtilsV3 from "./ParseRouteUtilsV3.js";

/**
 * Returns the closest bus on a given routeId and start position.
 * @param routeId
 * @param start
 * @returns {Object}
 */
async function getClosestBus(routeId, start) {
  LogUtils.log({ message: "getClosestBus: entering function", routeId });
  const vehicles = await RealtimeFeedUtilsV3.getVehicleData();

  if (!vehicles) {
    LogUtils.log({ message: "No vehicle data available" });
    return null;
  }

  const routeVehicles = Object.values(vehicles).filter(
    (vehicle) => vehicle.routeId == routeId
  );

  if (routeVehicles.length === 0) {
    LogUtils.log({ message: "No vehicles found for given route", routeId });
    return null;
  }

  const startPointList = start.split(",");
  const startPoint = { lat: startPointList[0], long: startPointList[1] };

  let closestVehicle = null;
  let minDistance = Infinity;

  for (const vehicle of routeVehicles) {
    const vehiclePosition = {
      lat: vehicle.latitude,
      long: vehicle.longitude,
    };

    const distance = ParseRouteUtilsV3.distanceBetweenPointsMiles(
      vehiclePosition,
      startPoint
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestVehicle = vehicle;
    }
  }

  if (!closestVehicle) {
    LogUtils.log({ message: "No closest vehicle found", routeId });
    return null;
  }

  LogUtils.log({ message: "Closest bus found", closestVehicle });
  return closestVehicle;
}

export default {
  getClosestBus,
};
