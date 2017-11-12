// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import GTFS from '../GTFS';
import TimeUtils from '../utils/TimeUtils';

class GetBusesRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/buses/:lineNumber/';
  }

  async content (req: Request) {
    let lineNumber: number = req.params.lineNumber;

    const currTime = Math.round((new Date()).getTime() / 1000);
    const serviceDate = TimeUtils.unixTimeToGTFSDate(currTime);
    let {buses} = await GTFS.buses(serviceDate);

    return {bus: buses[lineNumber]};
  }
}

export default new GetBusesRouter().router;
