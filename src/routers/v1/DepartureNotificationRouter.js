import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import NotificationUtils from '../../utils/NotificationUtils';

class DepartureNotification extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/departueNotification/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    if (
      !req.body
      || !req.body.deviceToken
      || typeof req.body.deviceToken !== 'string'
      || !req.body.startTime
      || typeof req.body.startTime !== 'string'
      || !req.body.uid
      || typeof req.body.uid !== 'string') {
      return null;
    }
    const {
      deviceToken,
      startTime,
    } = req.body;

    return NotificationUtils.waitForDeparture(deviceToken, startTime);
  }
}

export default new DepartureNotification().router;
