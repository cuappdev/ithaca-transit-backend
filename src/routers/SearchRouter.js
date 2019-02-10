// @flow
import fuzz from 'fuzzball';
import LRU from 'lru-cache';
import type Request from 'express';
import AllStopUtils from '../utils/AllStopUtils';
import ApplicationRouter from '../appdev/ApplicationRouter';
import RequestUtils from '../utils/RequestUtils';

const BUS_STOP = 'busStop';
const cacheOptions = {
  max: 10000, // Maximum size of cache
  maxAge: 1000 * 60 * 60 * 24 * 5, // Maximum age in milliseconds
};
const cache = LRU(cacheOptions);
const GOOGLE_PLACE = 'googlePlace';
const GOOGLE_PLACE_LOCATION = '42.4440,-76.5019';
const MIN_FUZZ_RATIO = 75;

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
    const cachedValue = cache.get(query);

    const allStops = await AllStopUtils.fetchAllStops();
    const filteredStops = allStops.filter(s => (
      fuzz.partial_ratio(s.name.toLowerCase(), query.toLowerCase()) >= MIN_FUZZ_RATIO
    ));
    filteredStops.sort((a, b) => fuzz.partial_ratio(query.toLowerCase(), b.name.toLowerCase()) - fuzz.partial_ratio(query.toLowerCase(), a.name.toLowerCase()));
    const formattedStops = filteredStops.map(s => ({
      type: BUS_STOP,
      lat: s.lat,
      long: s.long,
      name: s.name,
    }));

    if (cachedValue !== undefined) {
      // Return the list of googlePlaces and busStops
      return cachedValue.concat(formattedStops);
    }

    // not in cache
    const options = {
      method: 'GET',
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
      const googlePredictions = predictions.map(p => ({
        type: GOOGLE_PLACE,
        detail: p.structured_formatting.secondary_text,
        name: p.structured_formatting.main_text,
        placeID: p.place_id,
      }));
      const filteredPredictions = googlePredictions.filter(p => formattedStops.find(s => p.name.includes(s.name)) === undefined);
      cache.set(query, filteredPredictions);

      // Return the list of googlePlaces and busStops
      return filteredPredictions.concat(formattedStops);
    }
    return [];
  }
}

export default new SearchRouter().router;
