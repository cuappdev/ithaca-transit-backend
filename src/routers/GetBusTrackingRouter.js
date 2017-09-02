// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import axios from 'axios';

class GetBusTrackingRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/tracking/';
  }

  async content (req: Request) {
    const routeID = req.query.routeID;
    const baseURL = 'https://realtimetcatbus.availtec.com/InfoPoint/rest/Vehicles/GetAllVehiclesForRoute';
    try {
      const response = await axios.get(baseURL, {
        params: {
          routeID: routeID
        }
      });
      const parsedData = response.data.map((busInfo) => {
        var lastUpdated = busInfo.LastUpdated;
        const firstParan = lastUpdated.indexOf('(') + 1;
        const secondParan = lastUpdated.indexOf('-');
        lastUpdated = parseInt(lastUpdated.slice(firstParan, secondParan));
        return {
          commStatus: busInfo.CommStatus,
          destination: busInfo.Destination,
          deviation: busInfo.Deviation,
          direction: busInfo.Direction,
          displayStatus: busInfo.DisplayStatus,
          gpsStatus: busInfo.GPSStatus,
          heading: busInfo.Heading,
          lastStop: busInfo.LastStop,
          lastUpdated: lastUpdated,
          latitude: busInfo.Latitude,
          longitude: busInfo.Longitude,
          name: busInfo.Name,
          opStatus: busInfo.OpStatus,
          routeID: busInfo.RouteId,
          runID: busInfo.RunId,
          speed: busInfo.Speed,
          tripID: busInfo.TripId,
          vehicleID: busInfo.VehicleId
        };
      });
      return parsedData;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export default new GetBusTrackingRouter().router;
