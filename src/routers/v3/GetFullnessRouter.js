// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';

class GetFullnessRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/getBusFullness/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    // const {
    //   tripId,
    //   timestamp,
    //   fullness
    // } = req.body
  }
}

export default new GetFullnessRouter().router;
