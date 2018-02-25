// @flow
import AbstractRouter from './AbstractRouter';

class HelloWorldRouter extends AbstractRouter {

    constructor() {
        super('GET', '/', true);
    }

    async content(req: Request): Promise<any> {
        return 'hello, world\n';
    }

}

export default new HelloWorldRouter().router;