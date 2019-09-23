// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import SearchUtils from '../../utils/SearchUtils';

class AppleSearchRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/appleSearch/';
  }

  async content(req: Request): Promise<any> {
    if (!req.body || !req.body.query || typeof req.body.query !== 'string') {
      return null;
    }

    const query = req.body.query.toLowerCase();
    const cachedValue = SearchUtils.getCachedPredictionsForQuery(query);
    const formattedStops = await SearchUtils.getFormattedStopsForQuery(query);

    // Return the list of applePlaces and busStops
    return {
      applePlaces: cachedValue,
      busStops: formattedStops,
    };
  }
}

export default new AppleSearchRouter().router;
