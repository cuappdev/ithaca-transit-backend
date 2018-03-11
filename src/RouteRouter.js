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
        super('GET', '/route', true);
    }

    async content(req: Request): Promise<any> {
        let start: string = req.query.start;
        let end: string = req.query.end;
        let arriveBy: boolean = req.query.arriveBy == '1'
        let departureTimeQuery: string = req.query.time;
        let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000;
        //let departureTimeFifteenMinutesLater = departureTimeNowMs + 900000;
        let departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
        //let departureTimeDateLater = new Date(departureTimeFifteenMinutesLater).toISOString();
        
        try {
            let parameters: any = {
                vehicle: "pt",
                weighting: "short_fastest",
                point: [start, end],
                points_encoded: false,
            };
            parameters["pt.arrive_by"] = arriveBy;
            parameters["ch.disable"] = true;

            // if this was set to > 3.0, sometimes the route would suggest getting off bus earlier and walk half a mile instead of waiting longer
            parameters["pt.walk_speed"] = 3.0;
            parameters["pt.earliest_departure_time"] = departureTimeDateNow;
            parameters["pt.profile"] = true;
            parameters["pt.limit_solutions"] = 6
            
            let routeNowReq: any = axios.get('http://localhost:8988/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            //Wait until all requests finish
            let [routeNowResult] = await Promise.all([routeNowReq]);
    
            let routeNow = await RouteUtils.parseRoute(routeNowResult.data);
            
            routeNow = routeNow.filter(route => {
                var isValid = true;
                for (let index = 0; index < route.directions.length; index++) {
                    if (index != 0 && route.directions[index].type == "depart" && route.directions[index-1].type == "depart") {
                        var firstPT = route.directions[index-1];
                        var secondPT = route.directions[index];
                        isValid = firstPT.stops[firstPT.stops.length - 1].stopID == secondPT.stops[0].stopID;
                    }
                }
                return isValid;
            });

            routeNow = routeNow.map(route => {
                return RouteUtils.condense(route);
            });

            return routeNow;

        } catch (err) {
            throw err;
        }
    }
}

export default new RouteRouter().router;