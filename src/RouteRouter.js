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
        let departureTimeNowMs = parseFloat(departureTimeQuery) * 1000 - 600000;
        let departureTimeFifteenMinutesLater = departureTimeNowMs + 900000;
        let departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
        console.log(departureTimeDateNow);
        let departureTimeDateLater = new Date(departureTimeFifteenMinutesLater).toISOString();
        
        try {
            let parameters: any = {
                vehicle: "pt",
                //weighting: "short_fastest",
                point: [start, end],
                points_encoded: false,
                //elevation: false
            };
            //parameters["pt.arrive_by"] = arriveBy;
            //parameters["ch.disable"] = true;

            // if this was set to > 3.0, sometimes the route would suggest getting off bus earlier and walk half a mile instead of waiting longer
            parameters["pt.walk_speed"] = 3.0;
            parameters["pt.earliest_departure_time"] = departureTimeDateNow;
            parameters["pt.profile"] = true;
            
            let routeNowReq: any = axios.get('http://localhost:8988/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            let paramForLater = Object.assign({}, parameters);
            paramForLater["pt.earliest_departure_time"] = departureTimeDateLater;
            let routeLaterReq: any = axios.get('http://localhost:8988/route', {
                params: paramForLater,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            //Wait until all requests finish
            let [routeNowResult, routeLaterResult] = await Promise.all([routeNowReq, routeLaterReq]);
            //Filter out route duplicates
            var dups = []
            let routeNow = await RouteUtils.parseRoute(routeNowResult.data);
            routeNow = routeNow.filter(route => {
                console.log(route.directions.length);
                var isValid = true;
                for (let index = 0; index < route.directions.length; index++) {
                    console.log(route.directions[index].type);
                    if (index != 0 && route.directions[index].type == "depart" && route.directions[index-1].type == "depart") {
                        console.log("2 pts!!");
                        var firstPT = route.directions[index-1];
                        var secondPT = route.directions[index];
                        console.log(firstPT.stops[firstPT.stops.length - 1].stopID);
                        console.log(secondPT.stops[0].stopID);
                        isValid = firstPT.stops[firstPT.stops.length - 1].stopID == secondPT.stops[0].stopID;
                    }
                }
                return isValid;
            })
            return routeNow;
            //let routeLater = await RouteUtils.parseRoute(routeLaterResult.data);
            // var combinedRoutes = routeNow.concat(routeLater);
            // combinedRoutes = combinedRoutes.filter(route => {
            //     let stringifyRoute = JSON.stringify(route)
            //     if(dups.indexOf(stringifyRoute) == -1) {
            //         dups.push(stringifyRoute)
            //         return true;
            //     }
            //     return false;
            // });

            // return routeNow;
        } catch (err) {
            throw err;
        }
    }
}

export default new RouteRouter().router;