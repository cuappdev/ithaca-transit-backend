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
         + `Bus Navigation: http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/ | `
         + `Walking Navigation: http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/ | `
         + `Map-matching: http://${process.env.MAP_MATCHING || 'ERROR'}:8989/ `);
    }
}

export default new HelloWorldRouter().router;
