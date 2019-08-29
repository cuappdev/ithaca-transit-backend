// @flow
import LRU from 'lru-cache';
import RequestUtils from './RequestUtils';
import Constants from './Constants';

const placeIDToCoordsCacheOptions = {
  max: 10000, // Maximum size of cache
};
const placeIDToCoordsCache = LRU(placeIDToCoordsCacheOptions);

async function getCoordsForPlaceID(placeID: String): Object {
  const cachedValue = placeIDToCoordsCache.get(placeID);
  // Return an object of lat and long
  if (cachedValue) return cachedValue;

  // place id is not in cache so we must get lat and long
  const options = {
    ...Constants.GET_OPTIONS,
    url: 'https://maps.googleapis.com/maps/api/place/details/json',
    qs: {
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

export default {
  getCoordsForPlaceID,
};
