/* Cache constants */
const AUTOCOMPLETE_CACHE_OPTIONS = {
  max: 10000,
  maxAge: 1000 * 60 * 60 * 24 * 5,
};
const ROUTES_CALC_CACHE_OPTIONS = {
  max: 1000, // max 1000 routes in storage
  maxAge: 1000 * 60 * 15, // max age 15 minutes
};

/* Count constants */
const RETRY_COUNT = 5;

/* Delay Buffer constants */
// buffer to account for routes in past 20 minutes with delays
const FIRST_DELAY_BUFFER_IN_MINUTES = 20;
// additional buffer to account for time needed to walk from current location to bus stop
const SECOND_DELAY_BUFFER_IN_MINUTES = 40;

/* Distance & Speed constants */
// > 3.0 suggests getting off bus earlier and walk half a mile instead of waiting longer
const MAX_WALK_DIST_PER_LEG = 2000;
const RADIUS = 24140;
const WALK_SPEED = 3.0;

/* Degrees Precision constants */
const DEG_EQ_PRECISION = 5; // 5 degrees of precision is about a 1.1 meters, is a stop
const DEG_EXACT_PRECISION = 6; // 6 degrees of precision is about a 111 mm, is exact point
const DEG_KM_PRECISION = 2; // 3 degrees of precision is about 1 km, stop barely walkable
const DEG_MAX_PRECISION = 6;
const DEG_MIN_PRECISION = 1;
const DEG_NEARBY_PRECISION = 4; // 4 degrees of precision is about 11 meters, stop nearby
const DEG_WALK_PRECISION = 3; // 3 degrees of precision is about 111 meters, stop walkable

/* Server constants */
const PORT: number = parseInt(process.env.PORT) || 80;
const SERVER_ADDRESS: string = '0.0.0.0';

/* String & URL constants */
const CURRENT_LOCATION = 'Current Location';
const GOOGLE_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const TOKEN_URL = 'https://gateway.api.cloud.wso2.com:443/token';
const POSTMAN_TOKEN = '42201611-965d-4832-a4c5-060ad3ff3b83';

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
  GOOGLE_PLACES_URL,
  HOUR_IN_MS,
  MAX_WALK_DIST_PER_LEG,
  PORT,
  POSTMAN_TOKEN,
  RADIUS,
  RETRY_COUNT,
  ROUTES_CALC_CACHE_OPTIONS,
  SEC_IN_MS,
  SECOND_DELAY_BUFFER_IN_MINUTES,
  SERVER_ADDRESS,
  THREE_SEC_IN_MS,
  TOKEN_EXPIRATION_WINDOW_IN_MS,
  TOKEN_URL,
  WALK_SPEED,
};
