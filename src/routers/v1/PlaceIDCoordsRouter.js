// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import SearchUtils from '../../utils/SearchUtils';

class PlaceIDCoordsRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/placeIDCoords/';
  }

  async content(req: Request): Promise<any> {
    if (!req.body || !req.body.placeID || typeof req.body.placeID !== 'string') {
      return null;
    }
    const placeIDCoords = await SearchUtils.getCoordsForPlaceID(req.body.placeID);
    return placeIDCoords;
  }
}

export default new PlaceIDCoordsRouter().router;
