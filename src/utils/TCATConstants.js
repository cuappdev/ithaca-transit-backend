// @flow

// Time-based
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// So no bitwise overflow occurs when being used in Raptor
const INFINITY = Number.MAX_VALUE - 30 * DAY;

// Raptor-specific
const MAX_RAPTOR_ROUNDS = 4;
const RAPTOR_PROJECTED_DAYS = 6;

// Walking-based travel
const WALKING_TCAT_NUMBER = -1;
const START_WALKING = 'START_WALKING';
const END_WALKING = 'END_WALKING';

// NOTE: Put walking start time 30 days into the future to allow
// for all routing ops to be completed by then, so this is definitely
// the last leg of the journey to take
const BASE_END_TIME = DAY * 30;

export default {
  MINUTE,
  HOUR,
  DAY,
  INFINITY,
  MAX_RAPTOR_ROUNDS,
  RAPTOR_PROJECTED_DAYS,
  WALKING_TCAT_NUMBER,
  START_WALKING,
  END_WALKING,
  BASE_END_TIME
};
