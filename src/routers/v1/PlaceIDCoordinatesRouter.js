// @flow
import type Request from 'express';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import SearchUtils from '../../utils/SearchUtils';

class PlaceIDCoordinatesRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/placeIDCoordinates/';
  }

  async content(req: Request): Promise<any> {
    if (!req.body || !req.body.placeID || typeof req.body.placeID !== 'string') {
      return null;
    }
    const placeIDCoordinates = await SearchUtils.getCoordsForPlaceID(req.body.placeID);
    return placeIDCoordinates;
  }
}

export default new PlaceIDCoordinatesRouter().router;
