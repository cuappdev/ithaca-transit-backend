// @flow
import AlertsUtils from '../../utils/AlertsUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';

class AlertsRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/alerts/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    return AlertsUtils.fetchAlerts();
  }
}

export default new AlertsRouter().router;
