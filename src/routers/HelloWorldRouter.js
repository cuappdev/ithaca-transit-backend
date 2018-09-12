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
        return (`Hello World! Currently on ${process.env.NODE_ENV} environment.`);
    }
}

export default new HelloWorldRouter().router;
