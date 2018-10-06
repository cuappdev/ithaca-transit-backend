// @flow
import { AppDevRouter } from 'appdev';
import RequestUtils from '../utils/RequestUtils';
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

    async content(req): Promise<any> {
        if (!req.body || !req.body.data || !req.body.data.length || req.body.data.length === 0) {
            return {
                case: 'invalidData',
            };
        }

        const trackingInformation = [];
        let noData = false;

        await Promise.all(req.body.data.map(async (data): Promise<number> => {

            const { stopID, routeID, tripIdentifiers } = data;

            const realtimeDelayData = await RealtimeFeedUtils.getTrackingInformation(stopID, tripIdentifiers[0]);

            if (realtimeDelayData) {
                const authHeader = await TokenUtils.authHeader;

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
                                routeID,
                            },
                };

                const trackingRequest = await RequestUtils.createRequest(options, 'Tracking request failed');

                console.log(data, realtimeDelayData, trackingRequest);

                /**
                 * Parse request to object and map valid realtime data to info for each bus
                 */
                const trackingData = trackingRequest
                        && JSON.parse(trackingRequest)
                            .filter(
                                busInfo => busInfo.VehicleId === realtimeDelayData.vehicleID,
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
                    trackingInfo.delay = parseInt(realtimeDelayData.delay);
                    trackingInformation.push(trackingInfo);
                } else {
                    noData = true;
                }
            }
        })).catch((err) => {
            ErrorUtils.logErr(err, req.body, 'Tracking error');
            throw err;
        });

        if (trackingInformation.length > 0) {
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
