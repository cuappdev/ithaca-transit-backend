// @flow
import type Request from 'express';
import * as swaggerUI from 'swagger-ui-express';
import ApplicationRouter, { type ExpressCallback } from '../appdev/ApplicationRouter';
import * as swaggerDocument from '../swagger.json';

class DocsRouter extends ApplicationRouter<any> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/';
  }

  middleware(): ExpressCallback[] {
    return [swaggerUI.serve, swaggerUI.setup(swaggerDocument)];
  }

  // eslint-disable-next-line require-await
  async content(req: Request): any {
    return null;
  }
}

export default new DocsRouter().router;
