// @flow
import type { RaptorResponseElement } from '../BasedRaptor';
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import { Location, Stop } from '../models';
import TCATConstants from '../utils/TCATConstants';
import TCATUtils from '../utils/TCATUtils';
import TimeUtils from '../utils/TimeUtils';
import GTFS from '../GTFS';
import BasedRaptorUtils from '../utils/BasedRaptorUtils';
import BasedRaptor from '../BasedRaptor';

class GetRouteRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/routes/';
  }

  async content (req: Request) {
    console.log(req.url);
    const leaveBy = parseInt(req.query.leave_by);
    const dayStartTime = TimeUtils.unixTimeToDayTime(leaveBy);
    const serviceDate = TimeUtils.unixTimeToGTFSDate(leaveBy);
    const {buses, stopsToRoutes} = await GTFS.buses(serviceDate);

    // Start coordinate
    const startCoords = TCATUtils.coordStringToCoords(req.query.start_coords);
    const start = new Stop(
      TCATConstants.START_WALKING,
      new Location(startCoords.latitude, startCoords.longitude)
    );

    // End coordinate
    const endCoords = TCATUtils.coordStringToCoords(req.query.end_coords);
    const end = new Stop(
      TCATConstants.END_WALKING,
      new Location(endCoords.latitude, endCoords.longitude)
    );

    // Start / end stops
    const footpathMatrix = await BasedRaptorUtils.footpathMatrix(start, end);

    // Extrapolate out by 30 minutes, by 5 minute intervals
    let results: Array<RaptorResponseElement> = [];
    for (let i = 0; i <= 30 * 60; i += 5 * 60) {
      const basedRaptor = new BasedRaptor(
        buses,
        start,
        end,
        stopsToRoutes,
        footpathMatrix,
        dayStartTime,
        GTFS.stops
      );
      results = results.concat(basedRaptor.run());
    }

    // Sort
    results.sort((a: RaptorResponseElement, b: RaptorResponseElement) => {
      if (a.arrivalTime < b.arrivalTime) {
        return -1;
      } else if (a.arrivalTime > b.arrivalTime) {
        return 1;
      }
      return 0;
    });

    // Filter
    let routeSet = new Set();
    results = results.filter((r: RaptorResponseElement): boolean => {
      let stringified = JSON.stringify(r);
      if (routeSet.has(stringified)) return false;
      routeSet.add(stringified);
      return true;
    });

    // Run Raptor
    return {
      results: results.slice(0, 4), // top 4
      baseTime: parseInt(req.query.leave_by) - dayStartTime
    };
  }
}

export default new GetRouteRouter().router;
