// @flow
import LRU from 'lru-cache';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import Constants from '../../utils/Constants';
import RequestUtils from '../../utils/RequestUtils';

const cache = LRU(Constants.AUTOCOMPLETE_CACHE_OPTIONS);

class PlacesAutocompleteRouter extends ApplicationRouter<string> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/places/';
  }

  async content(req): Promise<any> {
    if (!req.body || !req.body.query || typeof req.body.query !== 'string') {
      return null;
    }

    const query = req.body.query.toLowerCase();
    const cachedValue = cache.get(query);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // not in cache
    const options = {
      method: 'GET',
      url: Constants.GOOGLE_AUTOCOMPLETE_URL,
      qs: {
        input: query,
        key: process.env.PLACES_KEY,
        location: Constants.GOOGLE_PLACE_LOCATION,
        radius: Constants.AUTOCOMPLETE_RADIUS,
        strictbounds: '',
      },
    };

    const autocompleteRequest = await RequestUtils.createRequest(options, 'Autocomplete request failed');

    if (autocompleteRequest) {
      const autocompleteResult = JSON.parse(autocompleteRequest);

      const { predictions } = autocompleteResult;
      const formattedPredictions = predictions.map(p => ({
        address: p.structured_formatting.secondary_text,
        name: p.structured_formatting.main_text,
        place_id: p.place_id,
      }));
      cache.set(query, formattedPredictions);
      return formattedPredictions;
    }
    return null;
  }
}

export default new PlacesAutocompleteRouter().router;
