// @flow
import RouteUtils from './RouteUtils';
import WalkingUtils from './WalkingUtils';
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
        let departureTimeDateNow = new Date(departureTimeNowMs).toISOString();
        
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

            console.log(JSON.stringify(parameters));
            
            let routeResult: any = await axios.get('http://localhost:8988/route', {
                params: parameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });
            console.log('set up bus route');

            let walkingParameters: any = {
                vehicle: "foot",
                point: [start, end],
                points_encoded: false
            };

            let walkingRoute: any = axios.get('http://localhost:8987/route', {
                params: walkingParameters,
                paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
            });

            console.log('set up walking route');

            //Wait until all requests finish
            let [walkingResult] = await Promise.all([walkingRoute]);
            console.log('finished awaiting');
    
            let routeNow = await RouteUtils.parseRoute(routeResult.data);
            let routeWalking = WalkingUtils.parseWalkingRoute(walkingResult.data, departureTimeNowMs)
            
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
            //now need to compare if walking route is better
            routeNow = routeNow.filter(route => {
                let walkingDirections = route.directions.filter(direction => { //only show walking directions
                    return direction.type == "walk"
                });
                let walkingTotals = walkingDirections.map(walk => {
                    return walk.distance
                });
                var totalWalkingForRoute = 0
                walkingTotals.forEach(element => {
                    totalWalkingForRoute += element;
                });
                //const reducer = (accumulator, currentWalk) => accumulator + currentWalk.distance;
                //let totalWalkingDistance = walkingDirections.reduce(reducer);
                //console.log( 'total walking distance ', parseFloat(totalWalkingDistance));
                //console.log('route walking distance', routeWalking.directions[0].distance);
                return totalWalkingForRoute <= routeWalking.directions[0].distance;
            });

            if (routeNow.length == 0) {
                return [routeWalking]
            }

            return routeNow;

        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}

export default new RouteRouter().router;