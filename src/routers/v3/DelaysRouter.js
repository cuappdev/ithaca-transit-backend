// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import RealtimeFeedUtils from '../../utils/RealtimeFeedUtils';

class DelaysRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/delays/';
  }

  async content(req): Promise<any> {
    const rtf = await RealtimeFeedUtils.fetchRTF();
    const delays = req.body.data.map(async ({ stopID, tripID }) => {
      const res = await RealtimeFeedUtils.getDelayInformation(
        stopID, tripID, rtf,
      );
      return {
        stopId: stopID,
        tripId: tripID,
        delay: res ? res.delay : null,
      };
    });
    return Promise.all(delays);
  }
}

export default new DelaysRouter().router;
