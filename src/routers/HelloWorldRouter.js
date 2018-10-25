// @flow
import type Request from 'express';
import AppDevRouter from '../appdev/AppDevRouter';
import { init } from '../server';

class HelloWorldRouter extends AppDevRouter<string> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/';
    }

    async content(req: Request): Promise<string> {
        const checkInit = (req.query.awaitInit !== undefined && `${await init}.`) || process.env.PORT;

        return (`Hello World! Environment: ${process.env.NODE_ENV || 'unknown'} | `
         + `Bus Navigation: http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/ | `
         + `Walking Navigation: http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/ | `
         + `Map-matching: http://${process.env.MAP_MATCHING || 'ERROR'}:8989/ | `
         + `Initialized on port: ${checkInit}`);
    }
}

export default new HelloWorldRouter().router;
