import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
// import { PYTHON_APP } from '../../utils/EnvUtils';
// eslint-disable-next-line no-unused-vars
import RequestUtils from '../../utils/RequestUtils';

// DelayNotification sends a request to the microservice with a deviceToken
// and tripID for user's who want to be notified of a tripID's given delays
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
      tripID,
    } = req.body;

    const options = {
      method: 'POST',
      url: 'http://host.docker.internal:8000/delayNotifs/',
      body: JSON.stringify({
        tripId: tripID,
        deviceToken,
      }),
      headers: { 'Content-Type': 'application/json' },
    };

    const delayNotifsRequest = await RequestUtils.createRequest(
      options,
      'delayNotifsRequestFailed',
    );

    return delayNotifsRequest;
  }
}

export default new DelayNotification().router;
