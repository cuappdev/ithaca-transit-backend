// @flow
import { AppDevRouter } from 'appdev';

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