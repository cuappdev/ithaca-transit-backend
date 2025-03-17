import { partial_ratio } from "fuzzball";
import { LRUCache } from "lru-cache";
import AllStopUtils from "./AllStopUtils.js";
import RequestUtils from "./RequestUtils.js";
import Constants from "./Constants.js";

const BUS_STOP = "busStop";
const MIN_FUZZ_RATIO = 75;
const placeIDToCoordsCacheOptions = {
  max: 10000, // Maximum size of cache
};
const placeIDToCoordsCache = new LRUCache(placeIDToCoordsCacheOptions);
const queryToPredictionsCacheOptions = {
  max: 10000, // Maximum size of cache
  maxAge: 1000 * 60 * 60 * 24 * 5, // Maximum age in milliseconds
};
const queryToPredictionsCache = new LRUCache(queryToPredictionsCacheOptions);

async function getCoordsForPlaceID(placeID) {
  const cachedValue = placeIDToCoordsCache.get(placeID);
  // Return an object of lat and long
  if (cachedValue) return cachedValue;

  // Place ID is not in cache so we must get lat and long
  const options = {
    ...Constants.GET_OPTIONS,
    url: "https://maps.googleapis.com/maps/api/place/details/json",
    qs: {
      fields: "geometry",
      placeid: placeID,
      key: process.env.PLACES_KEY,
    },
  };

  const placeIDDetailsRequest = await RequestUtils.createRequest(
    options,
    "Place ID Details request failed"
  );

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

async function getFormattedStopsForQuery(query) {
  const allStops = await AllStopUtils.fetchAllStops();
  const filteredStops = allStops.filter(
    (s) => partial_ratio(s.name.toLowerCase(), query) >= MIN_FUZZ_RATIO
  );
  filteredStops.sort((a, b) => {
    const aPartialRatio = partial_ratio(query, a.name.toLowerCase());
    const bPartialRatio = partial_ratio(query, b.name.toLowerCase());
    return bPartialRatio - aPartialRatio;
  });
  const formattedStops = filteredStops.map((s) => ({
    type: BUS_STOP,
    lat: s.lat,
    long: s.long,
    name: s.name,
  }));
  return formattedStops;
}

function getCachedPredictionsForQuery(query) {
  return queryToPredictionsCache.get(query);
}

function updateCachedPredictionsForQuery(query, places) {
  queryToPredictionsCache.set(query, places);
}

export default {
  getCachedPredictionsForQuery,
  getCoordsForPlaceID,
  getFormattedStopsForQuery,
  updateCachedPredictionsForQuery,
};
