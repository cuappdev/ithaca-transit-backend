// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import RealtimeFeedUtils from '../../utils/RealtimeFeedUtilsV3';

class DelayRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/delay/';
  }

  async content(req): Promise<any> {
    const rtf = await RealtimeFeedUtils.fetchRTF();
    const { stopID, tripID } = req.query;
    const res = await RealtimeFeedUtils.getDelayInformation(stopID, tripID, rtf);
    return res ? res.delay : null;
  }
}

export default new DelayRouter().router;
