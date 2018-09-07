// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import AlertsUtils from '../utils/AlertsUtils';

class AlertsRouter extends AppDevRouter<Array<Object>> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/alerts/';
    }

    async content(req: Request): Promise<any> {
        return AlertsUtils.getAlerts();
    }
}

export default new AlertsRouter().router;
