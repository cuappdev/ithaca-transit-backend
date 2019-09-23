// @flow
import fuzz from 'fuzzball';
import LRU from 'lru-cache';
import type Request from 'express';
import AllStopUtils from '../../utils/AllStopUtils';
import ApplicationRouter from '../../appdev/ApplicationRouter';
import RequestUtils from '../../utils/RequestUtils';
import SearchUtils from '../../utils/SearchUtils';
import Constants from '../../utils/Constants';

const queryToPredictionsCacheOptions = {
  max: 10000, // Maximum size of cache
  maxAge: 1000 * 60 * 60 * 24 * 5, // Maximum age in milliseconds
};
const queryToPredictionsCache = LRU(queryToPredictionsCacheOptions);
const GOOGLE_PLACE = 'googlePlace';
const GOOGLE_PLACE_LOCATION = '42.4440,-76.5019';

class SearchRouter extends ApplicationRouter<Array<Object>> {
  constructor() {
    super(['POST']);
  }

  getPath(): string {
    return '/search/';
  }

  async content(req: Request): Promise<Array<Object>> {
    if (!req.body || !req.body.query || typeof req.body.query !== 'string') {
      return [];
    }

    const query = req.body.query.toLowerCase();
    const cachedValue = queryToPredictionsCache.get(query);

    const formattedStops = await SearchUtils.getFormattedStopsForQuery(query);

    // Return the list of googlePlaces and busStops
    if (cachedValue) return cachedValue.concat(formattedStops);

    // not in cache
    const options = {
      ...Constants.GET_OPTIONS,
      url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      qs: {
        input: query,
        key: process.env.PLACES_KEY,
        location: GOOGLE_PLACE_LOCATION,
        radius: 24140,
        strictbounds: '',
      },
    };

    const autocompleteRequest = await RequestUtils.createRequest(options, 'Autocomplete request failed');

    if (autocompleteRequest) {
      const autocompleteResult = JSON.parse(autocompleteRequest);

      const { predictions } = autocompleteResult;

      const googlePredictions = await Promise.all(predictions.map(async (p): Promise<Object> => {
        const placeIDCoords = await SearchUtils.getCoordsForPlaceID(p.place_id);
        return {
          type: GOOGLE_PLACE,
          detail: p.structured_formatting.secondary_text,
          name: p.structured_formatting.main_text,
          placeID: p.place_id,
          lat: placeIDCoords.lat,
          long: placeIDCoords.long,
        };
      }));

      if (googlePredictions) {
        const filteredPredictions = getFilteredPredictions(googlePredictions, formattedStops);
        queryToPredictionsCache.set(query, filteredPredictions);
        return filteredPredictions.concat(formattedStops);
      }
    }
    return [];
  }
}

/**
 * Returns an array of googlePredictions that are not bus stops.
 * @param googlePredictions
 * @param busStops
 * @returns {Array<Object>}
 */
function getFilteredPredictions(
  googlePredictions: Array<Object>,
  busStops: Array<Object>,
): Array<Object> {
  return googlePredictions.filter((p) => {
    const stopsThatArePlaces = busStops.find(s => p.name.includes(s.name));
    return stopsThatArePlaces === undefined;
  });
}

export default new SearchRouter().router;
