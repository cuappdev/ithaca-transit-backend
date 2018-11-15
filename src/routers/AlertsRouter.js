// @flow
import ApplicationRouter from '../appdev/ApplicationRouter';
import AlertsUtils from '../utils/AlertsUtils';

class AlertsRouter extends ApplicationRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/alerts/';
    }

    // eslint-disable-next-line require-await
    async content(req): Promise<any> {
        return AlertsUtils.alerts;
    }
}

export default new AlertsRouter().router;
