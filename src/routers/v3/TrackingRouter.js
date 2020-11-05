// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import RealtimeFeedUtils from '../../utils/RealtimeFeedUtilsV3';

class TrackingRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/tracking/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    if (!req.body || !req.body.data || !req.body.data.length || req.body.data.length === 0) {
      return {
        case: 'invalidRequest',
      };
    }

    const { data } = req.body;
    return RealtimeFeedUtils.getTrackingResponse(data);
  }
}

export default new TrackingRouter().router;
