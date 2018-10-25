// @flow
import AppDevRouter from '../appdev/AppDevRouter';
import AlertsUtils from '../utils/AlertsUtils';

class AlertsRouter extends AppDevRouter<Array<Object>> {
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
