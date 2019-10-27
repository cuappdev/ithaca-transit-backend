// @flow
import fuzz from 'fuzzball';
import LRU from 'lru-cache';
import AllStopUtils from './AllStopUtils';
import RequestUtils from './RequestUtils';
import Constants from './Constants';

const BUS_STOP = 'busStop';
const MIN_FUZZ_RATIO = 75;
const placeIDToCoordsCacheOptions = {
  max: 10000, // Maximum size of cache
};
const placeIDToCoordsCache = LRU(placeIDToCoordsCacheOptions);
const queryToPredictionsCacheOptions = {
  max: 10000, // Maximum size of cache
  maxAge: 1000 * 60 * 60 * 24 * 5, // Maximum age in milliseconds
};
const queryToPredictionsCache = LRU(queryToPredictionsCacheOptions);

async function getCoordsForPlaceID(placeID: String): Object {
  const cachedValue = placeIDToCoordsCache.get(placeID);
  // Return an object of lat and long
  if (cachedValue) return cachedValue;

  // Place ID is not in cache so we must get lat and long
  const options = {
    ...Constants.GET_OPTIONS,
    url: 'https://maps.googleapis.com/maps/api/place/details/json',
    qs: {
      fields: 'geometry',
      placeid: placeID,
      key: process.env.PLACES_KEY,
    },
  };

  const placeIDDetailsRequest = await RequestUtils.createRequest(options, 'Place ID Details request failed');

  if (placeIDDetailsRequest) {
    const placeIDDetailsResult = JSON.parse(placeIDDetailsRequest);
    const placeIDCoords = {
      lat: placeIDDetailsResult.result.geometry.location.lat,
      long: placeIDDetailsResult.result.geometry.location.lng,
    };

    placeIDToCoordsCache.set(placeID, placeIDCoords);
    return placeIDCoords;
  }
  return {
    lat: null,
    long: null,
  };
}

async function getFormattedStopsForQuery(query: String): Promise<Array<Object>> {
  const allStops = await AllStopUtils.fetchAllStops();
  const filteredStops = allStops.filter(s => (
    fuzz.partial_ratio(s.name.toLowerCase(), query) >= MIN_FUZZ_RATIO
  ));
  filteredStops.sort((a, b) => {
    const aPartialRatio = fuzz.partial_ratio(query, a.name.toLowerCase());
    const bPartialRatio = fuzz.partial_ratio(query, b.name.toLowerCase());
    return bPartialRatio - aPartialRatio;
  });
  const formattedStops = filteredStops.map(s => ({
    type: BUS_STOP,
    lat: s.lat,
    long: s.long,
    name: s.name,
  }));
  return formattedStops;
}

function getCachedPredictionsForQuery(query: string): ?Array<Object> {
  return queryToPredictionsCache.get(query);
}

function updateCachedPredictionsForQuery(query: String, places: Array<Object>): void {
  queryToPredictionsCache.set(query, places);
}

export default {
  getCachedPredictionsForQuery,
  getCoordsForPlaceID,
  getFormattedStopsForQuery,
  updateCachedPredictionsForQuery,
};
