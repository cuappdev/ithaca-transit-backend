// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import SearchUtils from '../../utils/SearchUtils';

class ApplePlacesRouter extends ApplicationRouter<Object> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/applePlaces/';
  }

  // eslint-disable-next-line require-await
  async content(req: Request): Promise<any> {
    if (
      !req.body
      || !req.body.query
      || typeof req.body.query !== 'string'
      || !req.body.places
      || !Array.isArray(req.body.places)) {
      return false;
    }
    const query = req.body.query.toLowerCase();
    SearchUtils.updateCachedPredictionsForQuery(query, req.body.places);
    return true;
  }
}

export default new ApplePlacesRouter().router;
