// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';

/**
 * Handler for responding to a GET request on the root route.
 * @extends AppDevRouter
 */
class HelloWorldRouter extends AppDevRouter<string> {
    constructor() {
        super('GET');
    }

    getPath(): string {
        return '/';
    }

    async content(req: Request): Promise<string> {
        return 'hello, world!';
    }
}

export default new HelloWorldRouter().router;
