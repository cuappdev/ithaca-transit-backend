/* eslint-disable no-await-in-loop */ // TODO refactor awaits in loop
// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import request from 'request';
import HTTPRequestUtils from '../utils/HTTPRequestUtils';
import RealtimeFeedUtils from '../utils/RealtimeFeedUtils';
import TokenUtils from '../utils/TokenUtils';
import ErrorUtils from '../utils/ErrorUtils';

class TrackingRouter extends AppDevRouter<Object> {
    constructor() {
        super('POST');
    }

    getPath(): string {
        return '/tracking/';
    }

    async content(req: Request): Promise<any> {
        const trackingArray = req.body.data;
        let foundTrackingData = false;
        const trackingInformation = [];
        let noData = false;

        for (let index = 0; index < trackingArray.length; index++) {
            const data = trackingArray[index];
            const realtimeData = RealtimeFeedUtils.getTrackingInformation(data.stopID, data.tripIdentifiers);

            if (!realtimeData.noInfoYet) {
                try {
                    const authHeader = await TokenUtils.getAuthorizationHeader();

                    const options = {
                        method: 'GET',
                        url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Vehicles/GetAllVehiclesForRoute',
                        headers:
                            {
                                'Postman-Token': 'b688b636-87ea-4e04-9f3e-ba34e811e639',
                                'Cache-Control': 'no-cache',
                                Authorization: authHeader,
                            },
                        qs:
                            {
                                routeID: data.routeID,
                            },
                    };

                    const trackingRequest = HTTPRequestUtils.createRequest(options, null, 'Tracking request failed');

                    /**
                     * Parse request to object and map valid realtime data to info for each bus
                     */
                    const trackingData = trackingRequest
                        && JSON.parse(trackingRequest).data
                            .filter(
                                busInfo => busInfo.VehicleId === realtimeData.vehicleID,
                            ).map((busInfo) => {
                                let lastUpdated = busInfo.LastUpdated;
                                const firstParan = lastUpdated.indexOf('(') + 1;
                                const secondParan = lastUpdated.indexOf('-');
                                lastUpdated = parseInt(lastUpdated.slice(firstParan, secondParan));
                                return {
                                    case: 'validData',
                                    commStatus: busInfo.CommStatus,
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
                            });

                    // we have tracking data for the bus
                    if (trackingData && trackingData.length > 0) {
                        const trackingInfo = trackingData[0];
                        trackingInfo.delay = parseInt(realtimeData.delay);
                        trackingInformation.push(trackingInfo);
                        foundTrackingData = true;
                    } else {
                        noData = true;
                    }
                } catch (err) {
                    ErrorUtils.log(err, trackingArray, 'Tracking error');
                    throw err;
                }
            }
        }
        if (foundTrackingData) {
            return trackingInformation;
        } if (noData) {
            return {
                case: 'noData',
            };
        }
        return {
            case: 'invalidData',
        };
    }
}

export default new TrackingRouter().router;
