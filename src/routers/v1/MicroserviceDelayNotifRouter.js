import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import NotificationUtils from '../../utils/NotificationUtils';

// This route should only be accessed by the microservice. When the
// microservice makes a request to this endpoint, it will send a notification
// to the user with the corresponding deviceToken.
class MicroserviceNotif extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/microserviceNotif/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    if (
      !req.body
      || !req.body.deviceToken
      || typeof req.body.deviceToken !== 'string'
      || !req.body.routeID
      || typeof req.body.routeID !== 'string') {
      return null;
    }
    const {
      deviceToken,
      routeID,
    } = req.body;

    const notifData = {
      data: `The bus on ${routeID} is delayed`,
      notification: 'testBody',
    };
    console.log(routeID);
    return NotificationUtils.sendNotification(deviceToken, notifData);
  }
}

export default new MicroserviceNotif().router;
