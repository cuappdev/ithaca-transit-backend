// @flow
import RouteUtils from './RouteUtils';
import AbstractRouter from './AbstractRouter';
import TCATUtils from './TCATUtils';
import axios from 'axios';
import qs from 'qs';
import csv from 'csvtojson';
import fs from 'fs';
import createGpx from 'gps-to-gpx';
import type Request from 'express';

class RouteRouter extends AbstractRouter {

    constructor() {
        super('GET', '/route', false);
    }

    async content(req: Request): Promise<any> {
        let start: string = req.query.start;
        let end: string = req.query.end;
        let arriveBy: boolean = req.query.arriveBy == '1'
        let departureTimeQuery: string = req.query.time;
        let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
        let departureTimeFifteenMinutesLater = departureTimeNowMs + 900000;
        let departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
        let departureTimeDateLater = new Date(departureTimeFifteenMinutesLater).toISOString();
        
        try {
            let parameters: any = {
                locale: "en-US",
                vehicle: "pt",
                weighting: "short_fastest",
                point: [start, end],
                points_encoded: false,
                use_miles: true
            };
            parameters["pt.arrive_by"] = arriveBy;
            parameters["ch.disable"] = true;

            // if this was set to > 3.0, sometimes the route would suggest getting off busy earlier and walk half a mile instead of waiting longer
            parameters["pt.walk_speed"] = 3.0;
            parameters["pt.earliest_departure_time"] = departureTimeDateNow;

            let routeNowReq: any = axios.get('http://localhost:8988/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            parameters["pt.earliest_departure_time"] = departureTimeDateLater;
            let routeLaterReq: any = axios.get('http://localhost:8988/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            //Wait until all requests finish
            let [routeNowResult, routeLaterResult] = await Promise.all([routeNowReq, routeLaterReq]);

            //Filter out route duplicates
            var dups = []
            let routeNow = await RouteUtils.parseRoute(routeNowResult.data);
            let routeLater = await RouteUtils.parseRoute(routeLaterResult.data);
            var combinedRoutes = routeNow.concat(routeLater);
            combinedRoutes = combinedRoutes.filter(route => {
                let stringifyRoute = JSON.stringify(route)
                if(dups.indexOf(stringifyRoute) == -1) {
                    dups.push(stringifyRoute)
                    return true;
                }
                return false;
            });

            return JSON.stringify(combinedRoutes);
        } catch (err) {
            throw err;
        }
    }
}

export default new RouteRouter().router;