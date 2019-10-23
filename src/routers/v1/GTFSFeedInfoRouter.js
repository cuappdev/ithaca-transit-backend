// @flow
import GTFSUtils from '../../utils/GTFSUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';

class GTFSFeedInfoRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/GTFSFeedInfo/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    return GTFSUtils.getFeedInfo();
  }
}

export default new GTFSFeedInfoRouter().router;
