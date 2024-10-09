import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import NotificationUtils from '../../utils/NotificationUtils';
// import { PYTHON_APP } from '../../utils/EnvUtils';

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
      // tripID,
    } = req.body;

    const notifData = {
      data: 'Your bus is delayed',
      notification: 'testBody',
    };

    // const options = {
    //   method: 'POST',
    //   url: `http://${PYTHON_APP || 'ERROR'}:5000/delayNotifs`,
    //   body: {
    //     deviceToken,
    //     tripId: tripID,
    //   },
    //   headers: { 'Cache-Control': 'no-cache' },
    //   timeout: THREE_SEC_IN_MS,
    // };

    // const delayNotifsRequest = await RequestUtils.createRequest(
    //   options,
    //   'delayNotifsRequestFailed',
    // );

    return NotificationUtils.sendNotification(deviceToken, notifData);
  }
}

export default new DelayNotification().router;
