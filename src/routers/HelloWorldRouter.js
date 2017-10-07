// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';

class HelloWorldRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/hello/';
  }

  async content (req: Request) {
    return { message: 'Hello, World!' };
  }
}

export default new HelloWorldRouter().router;
