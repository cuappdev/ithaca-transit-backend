// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import RealtimeFeedUtils from '../../utils/RealtimeFeedUtilsV3';

class DelaysRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/delays/';
  }

  async content(req): Promise<any> {
    const rtf = await RealtimeFeedUtils.fetchRTF();
    const delays = req.body.data.map(async ({ stopId, tripId }) => {
      const res = await RealtimeFeedUtils.getDelayInformation(
        stopId, tripId, rtf,
      );
      return {
        stopId,
        tripId,
        delay: res ? res.delay : null,
      };
    });
    return Promise.all(delays);
  }
}

export default new DelaysRouter().router;
