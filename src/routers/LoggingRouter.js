// @flow
import type Request from 'express';
import ApplicationRouter from '../appdev/ApplicationRouter';
import LogUtils from '../utils/LogUtils';

class LoggingRouter extends ApplicationRouter<string> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/logSelection/';
    }

    async content(req: Request): Promise<string> {

        return true;
    }
}

export default new LoggingRouter().router;
