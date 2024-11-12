// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import ReliabilityUtils from '../../utils/ReliabilityUtils';

class GetFullnessRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['GET']);
  }

  getPath(): string {
    return '/getBusFullness/';
  }

  // eslint-disable-next-line require-await
  async content(req): Promise<any> {
    const {
      tripId,
    } = req.body;

    // Validate input
    if (typeof tripId !== 'number') {
      return {
        message: 'Invalid input.',
      };
    }

    const recentReport = ReliabilityUtils.getBusFullness(tripId);

    return recentReport;
  }
}

export default new GetFullnessRouter().router;
