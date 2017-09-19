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
    return '/buses/';
  }

  async content (req: Request) {
    const currTime = Math.round((new Date()).getTime() / 1000);
    const serviceDate = TimeUtils.unixTimeToGTFSDate(currTime);
    let {buses} = await GTFS.buses(serviceDate);
    return buses;
  }
}

export default new GetBusesRouter().router;
