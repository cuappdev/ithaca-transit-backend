// @flow
import { AppDevRouter } from 'appdev';
import AlertsUtils from '../utils/AlertsUtils';

class AlertsRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/alerts/';
    }

    async content(req): Promise<any> {
        return AlertsUtils.getAlerts();
    }
}

export default new AlertsRouter().router;
