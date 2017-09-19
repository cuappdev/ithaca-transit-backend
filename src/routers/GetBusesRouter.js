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
    try {
      const currTime = Math.floor(new Date().getTime());
      const serviceDate = TimeUtils.unixTimeToGTFSDate(currTime);
      return await GTFS.buses(serviceDate, {});
    } catch (e) {
      return e;
    }
  }
}

export default new GetBusesRouter().router;
