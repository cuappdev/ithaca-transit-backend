/* Cache constants */
const AUTOCOMPLETE_CACHE_OPTIONS = {
  max: 10000, // Max 10000 autocomplete results
  maxAge: 1000 * 60 * 60 * 24 * 5, // Max age in 5 days
};
const ROUTES_CALC_CACHE_OPTIONS = {
  max: 1000, // Max 1000 routes
  maxAge: 1000 * 60 * 15, // Max age in 15 minutes
};
const QUERY_PREDICTIONS_CACHE_OPTIONS = {
  max: 10000, // Max 1000 predictions
  maxAge: 1000 * 60 * 60 * 24 * 5, // Max age in 5 days
};

/* Count constants */
// The minimum fuzzy string matching ratio that a word has to match a target word for /search
const MIN_FUZZ_RATIO = 75;

/* Delay Buffer constants */
// buffer to account for routes in past 20 minutes with delays
const FIRST_DELAY_BUFFER_IN_MINUTES = 20;
// additional buffer to account for time needed to walk from current location to bus stop
const SECOND_DELAY_BUFFER_IN_MINUTES = 40;

/* Distance & Speed constants */
// > 3.0 suggests getting off bus earlier and walk half a mile instead of waiting longer
const MAX_WALK_DIST_PER_LEG = 2000;
// The distance (in meters) within which to return Google place results for autocomplete.
const AUTOCOMPLETE_RADIUS = 24140;
const WALK_SPEED = 3.0;

/* Degrees Precision constants */
const DEG_MIN_PRECISION = 1;
const DEG_KM_PRECISION = 2; // 3 degrees of precision is about 1 km, stop barely walkable
const DEG_WALK_PRECISION = 3; // 3 degrees of precision is about 111 meters, stop walkable
const DEG_NEARBY_PRECISION = 4; // 4 degrees of precision is about 11 meters, stop nearby
const DEG_EQ_PRECISION = 5; // 5 degrees of precision is about a 1.1 meters, is a stop
const DEG_EXACT_PRECISION = 6; // 6 degrees of precision is about a 111 mm, is exact point
const DEG_MAX_PRECISION = 6;

/* String & URL constants */
const BUS_STOP = 'busStop';
const CURRENT_LOCATION = 'Current Location';
const GOOGLE_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACE = 'googlePlace';
const GOOGLE_PLACE_LOCATION = '42.4440,-76.5019';
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const TOKEN_URL = 'https://gateway.api.cloud.wso2.com:443/token';

/* Time constants */
const SEC_IN_MS = 1000;
const MIN_IN_MS = SEC_IN_MS * 60;
const HOUR_IN_MS = MIN_IN_MS * 60;
const THREE_SEC_IN_MS = 3000;
const TOKEN_EXPIRATION_WINDOW_IN_MS = 500;

/* Request constants */
const GET_OPTIONS = {
  method: 'GET',
  headers: { 'Cache-Control': 'no-cache' },
  timeout: THREE_SEC_IN_MS,
};

export default {
  AUTOCOMPLETE_CACHE_OPTIONS,
  BUS_STOP,
  CURRENT_LOCATION,
  DEG_EQ_PRECISION,
  DEG_EXACT_PRECISION,
  DEG_KM_PRECISION,
  DEG_MAX_PRECISION,
  DEG_MIN_PRECISION,
  DEG_NEARBY_PRECISION,
  DEG_WALK_PRECISION,
  FIRST_DELAY_BUFFER_IN_MINUTES,
  GET_OPTIONS,
  GOOGLE_AUTOCOMPLETE_URL,
  GOOGLE_PLACE,
  GOOGLE_PLACE_LOCATION,
  GOOGLE_PLACES_URL,
  HOUR_IN_MS,
  MIN_FUZZ_RATIO,
  MAX_WALK_DIST_PER_LEG,
  QUERY_PREDICTIONS_CACHE_OPTIONS,
  AUTOCOMPLETE_RADIUS,
  ROUTES_CALC_CACHE_OPTIONS,
  SEC_IN_MS,
  SECOND_DELAY_BUFFER_IN_MINUTES,
  THREE_SEC_IN_MS,
  TOKEN_EXPIRATION_WINDOW_IN_MS,
  TOKEN_URL,
  WALK_SPEED,
};
