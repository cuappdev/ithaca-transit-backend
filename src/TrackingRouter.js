// @flow
import TokenUtils from './TokenUtils';
import AbstractRouter from './AbstractRouter';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import type Request from 'express';
import axios from 'axios';
import qs from 'qs';

class TrackingRouter extends AbstractRouter {

    constructor() {
        super('GET', '/tracking', true);
    }

    async content(req: Request): Promise<any> {
        let routeID = req.query.routeID;
        let tripID = req.query.tripID;
        let stopID = req.query.stopID;

        let realtimeData = RealtimeFeedUtils.getTrackingInformation(stopID, tripID);
        if (realtimeData.noInfoYet) {
            return {
                case: 'invalidData'
            }
        }
        try {
            let authHeader = await TokenUtils.getAuthorizationHeader()
            let parameters: any = {
                routeID: routeID
            };
            let trackingRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Vehicles/GetAllVehiclesForRoute', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' }),
                headers: { Authorization: authHeader }
            });
            const trackingData = trackingRequest.data.filter(busInfo => {
                return busInfo.VehicleId == realtimeData.vehicleID;
            }).map((busInfo) => {
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
                    vehicleID: busInfo.VehicleId,
                    case: 'validData'
                };
            });

            //we have tracking data for the bus
            if (trackingData.length > 0) {
                let trackingInfo = trackingData[0];
                trackingInfo.delay = parseInt(realtimeData.delay);
                return trackingInfo;
            }

            //return empty data which indicates no realtime tracking available :(
            return {
                case: 'noData'
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

}

export default new TrackingRouter().router;