// @flow
import AbstractRouter from './AbstractRouter';
import AlertsUtils from './AlertsUtils';

class AlertsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/alerts', true);
    }

    async content(req: Request): Promise<any> {
        return AlertsUtils.getAlerts();
    }
}

export default new AlertsRouter().router;