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
    axios.get(baseURL, {
      params: {
        routeID: routeID
      }
    })
      .then((response) => {
        var parsedData = response.data.map((busInfo) => {
          return {
            commStatus: busInfo.CommStatus,
            destination: busInfo.Destination,
            deviation: busInfo.Deviation,
            direction: busInfo.Direction,
            displayStatus: busInfo.DisplayStatus,
            gpsStatus: busInfo.GPSStatus,
            heading: busInfo.Heading,
            lastStop: busInfo.LastStop,
            lastUpdated: busInfo.LastUpdated,
            latitude: busInfo.Latitude,
            longitude: busInfo.Longitude,
            name: busInfo.Name,
            opStatus: busInfo.OpStatus,
            routeID: busInfo.RouteId,
            runID: busInfo.RunId,
            speed: busInfo.Speed,
            tripID: busInfo.TripId,
            behicleID: busInfo.VehicleId
          };
        });
        return {
          success: true,
          data: parsedData
        };
      })
      .catch(() => {
        return {
          success: false,
          data: []
        };
      });
  }
}

export default new GetBusTrackingRouter().router;
