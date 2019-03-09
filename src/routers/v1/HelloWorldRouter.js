// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';

class HelloWorldRouter extends ApplicationRouter<string> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    return `Hello World! Environment: ${process.env.NODE_ENV || 'unknown'} | `
      + `Bus Navigation: http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/ | `
      + `Walking Navigation: http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/ | `
      + `Map-matching: http://${process.env.MAP_MATCHING || 'ERROR'}:8989/ | `;
  }
}

export default new HelloWorldRouter().router;
