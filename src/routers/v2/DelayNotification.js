// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import NotificationUtils from '../../utils/NotificationUtils';

class DelayNotification extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/delayNotification/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    if (
      !req.body
      || !req.body.deviceToken
      || typeof req.body.deviceToken !== 'string'
      || !req.body.stopID
      || typeof req.body.stopID !== 'string'
      || !req.body.tripID
      || typeof req.body.tripID !== 'string'
      || !req.body.uid
      || typeof req.body.uid !== 'string') {
      return null;
    }
    const {
      deviceToken,
      stopID,
      tripID,
      uid,
    } = req.body;
    return NotificationUtils.notifyForDelays(deviceToken, tripID, stopID, uid);
  }
}

export default new DelayNotification().router;
