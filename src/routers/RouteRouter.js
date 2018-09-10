// @flow
import { AppDevRouter } from 'appdev';
import axios from 'axios';
import qs from 'qs';
import type Request from 'express';
import WalkingUtils from '../utils/WalkingUtils';
import RouteUtils from '../utils/RouteUtils';
import ErrorUtils from '../utils/ErrorUtils';

class RouteRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/route/';
    }

    async content(req: Request): Promise<Array<Object>> {
        const {
            start,
            end,
            destinationName,
            time: departureTimeQuery,
        } = req.query;
        const arriveBy: boolean = req.query.arriveBy === '1';
        let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
        let departureDelayBuffer: boolean = false;
        const departureTimeNowActualMs = departureTimeNowMs;
        if (!arriveBy) { // 'leave at' query
            departureDelayBuffer = true;
            const delayBuffer = 5; // minutes
            departureTimeNowMs = departureTimeNowActualMs - delayBuffer * 60 * 1000; // so we can potentially display delayed routes
        }
        const departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
        const oneHourInMilliseconds = 3600000;

        const parameters: any = {
            vehicle: 'pt',
            weighting: 'short_fastest',
            elevation: false,
            point: [start, end],
            points_encoded: false,
        };
        parameters['pt.arrive_by'] = arriveBy;
        parameters['ch.disable'] = true;

        // if this was set to > 3.0, sometimes the route would suggest getting off bus earlier and walk half a mile instead of waiting longer
        parameters['pt.walk_speed'] = 3.0;
        parameters['pt.earliest_departure_time'] = departureTimeDateNow;
        parameters['pt.profile'] = true;
        parameters['pt.max_walk_distance_per_leg'] = 2000;

        const walkingParameters: any = {
            vehicle: 'foot',
            point: [start, end],
            points_encoded: false,
        };

        let busRoute;
        let walkingRoute;
        const errors = [];

        try {
            busRoute = await axios.get(`http://${process.env.GHOPPER_BUS}:8988/route`, {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' }),
            });
        } catch (routeErr) {
            errors.push(ErrorUtils.log(routeErr, parameters, `Routing failed: ${process.env.GHOPPER_BUS}`));
            busRoute = null;
        }

        try {
            walkingRoute = await axios.get(`http://${process.env.GHOPPER_WALKING}:8987/route`, {
                params: walkingParameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' }),
            });
        } catch (walkingErr) {
            errors.push(ErrorUtils.log(walkingErr.response.data.hints[0].message, parameters, `Walking failed: ${process.env.GHOPPER_WALKING}`));
            walkingRoute = null;
        }

        if (!busRoute && !walkingRoute) {
            return errors;
        }

        const routeWalking = WalkingUtils.parseWalkingRoute(walkingRoute.data, departureTimeNowMs, destinationName);

        // if there are no bus routes, we should just return walking instead of crashing
        if (!busRoute) {
            return [routeWalking];
        }

        let routeNow = await RouteUtils.parseRoute(busRoute.data, destinationName);

        routeNow = routeNow.filter((route) => {
            let isValid = true;
            for (let index = 0; index < route.directions.length; index++) {
                if (index !== 0 && route.directions[index].type === 'depart' && route.directions[index - 1].type === 'depart') {
                    const firstPT = route.directions[index - 1];
                    const secondPT = route.directions[index];
                    isValid = firstPT.stops[firstPT.stops.length - 1].stopID === secondPT.stops[0].stopID;
                }
            }
            return isValid;
        });

        const routePointParams = start.split(',').concat(end.split(','));

        routeNow = routeNow.map(route => RouteUtils.condense(route,
            { lat: routePointParams[0], long: routePointParams[1] },
            { lat: routePointParams[2], long: routePointParams[3] }));

        // now need to compare if walking route is better
        routeNow = routeNow.filter((route) => {
            const walkingDirections = route.directions.filter(direction => direction.type === 'walk');
            const walkingTotals = walkingDirections.map(walk => walk.distance);
            let totalWalkingForRoute = 0;
            walkingTotals.forEach((element) => {
                totalWalkingForRoute += element;
            });
            return totalWalkingForRoute <= routeWalking.directions[0].distance;
        });

        if (routeNow.length === 0) {
            return [routeWalking];
        }

        // throw out routes with over 2 hours time between each direction
        // also throw out routes that will depart before the query time if query is for 'leave at'
        routeNow = routeNow.filter((route) => {
            let keepRoute = true;
            for (let index = 0; index < route.directions.length; index++) {
                const direction = route.directions[index];
                const startTime = Date.parse(direction.startTime);
                const endTime = Date.parse(direction.endTime);
                if (startTime + (oneHourInMilliseconds * 2) <= endTime) {
                    keepRoute = false;
                }

                if (index !== 0) { // means we can access the previous direction endTime
                    const prevEndTime = Date.parse(route.directions[index - 1].endTime);
                    if (prevEndTime + oneHourInMilliseconds < startTime) {
                        keepRoute = false;
                    }
                }
                if (departureDelayBuffer) { // make sure user can catch the bus
                    if (direction.type === 'depart') {
                        const busActualDepartTime = startTime + (direction.delay != null ? direction.delay * 1000 : 0);
                        if (busActualDepartTime < departureTimeNowActualMs) {
                            keepRoute = false;
                        }
                    }
                }
            }
            return keepRoute;
        });

        return routeNow;
    }
}

export default new RouteRouter().router;
