// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';

class TrackingRouter extends AbstractRouter {

    constructor() {
        super('GET', '/tracking', true);
    }

    async content(req: Request): Promise<any> {
        let routeID = req.query.routeID;
        const AuthStr = 'Bearer 5a54bc7f-a7df-3796-a83a-5bba7a8e31c8';
        try {
        let trackingRequest = await axios.get('https://realtimetcatbus.availtec.com/InfoPoint/rest/Vehicles/GetAllVehiclesForRoute?routeID=' + routeID, {headers: {Authorization: AuthStr}});
        const trackingData = trackingRequest.data.map((busInfo) => {
            let lastUpdated = busInfo.LastUpdated;
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
          return trackingData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

}

export default new TrackingRouter().router;