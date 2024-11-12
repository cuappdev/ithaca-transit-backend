// @flow
import ApplicationRouter from '../../appdev/ApplicationRouter';
import ReliabilityUtils from '../../utils/ReliabilityUtils';

class ReportFullnessRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/reportBusFull/';
  }

  // eslint-disable-next-line require-await
  async content(req):
    Promise<any> {
    // Parse request body
    const { tripId, time, fullness } = req.body;

    // Validate input
    if (typeof tripId !== 'number' || typeof time !== 'number' || typeof fullness !== 'number') {
      return {
        message: 'Invalid input: tripId, time, and fullness must be numbers',
      };
    }

    // Store new report in json file
    const storeReport = await ReliabilityUtils.storeReportJson(tripId, time, fullness);

    return storeReport;
  }
}

export default new ReportFullnessRouter().router;
