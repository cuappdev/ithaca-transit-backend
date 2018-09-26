// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';

class HelloWorldRouter extends AppDevRouter<string> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/';
    }

    async content(req: Request): Promise<string> {
        return (`Hello World! Environment: ${process.env.NODE_ENV || 'unknown'} | `
         + `Graphhopper bus: http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/ | `
         + `Graphhopper walking: http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987 `);
    }
}

export default new HelloWorldRouter().router;
