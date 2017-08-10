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

export default {
  MINUTE,
  HOUR,
  DAY,
  INFINITY,
  MAX_RAPTOR_ROUNDS,
  RAPTOR_PROJECTED_DAYS
};
