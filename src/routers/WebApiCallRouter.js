// @flow

import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import WebApiUtils from '../utils/WebApiUtils';

class WebApiCallRouter extends AppDevRouter {

  restURL: string;
  apiPath: string;
  webApi: any;  

  constructor (restURL: string, apiPath: string) { 
    super('GET');
    this.restURL = restURL;
    this.apiPath = apiPath;
    this.webApi = WebApiUtils.webApiCall(restURL);
  }

  getPath (): string {
    return this.apiPath;
  }

  async content (req: Request) {
    //const data = await this.webApi();
    return 'fuck';
  }
}

export default WebApiCallRouter;
