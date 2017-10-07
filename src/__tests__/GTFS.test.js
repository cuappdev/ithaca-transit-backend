/* eslint-disable no-undef */
import 'babel-polyfill';
import TimeUtils from '../utils/TimeUtils';
import GTFS from '../GTFS';

const currTime = Math.round(1504474540);
const serviceDate = TimeUtils.unixTimeToGTFSDate(currTime);

describe('Testing GTFS', () => {
  it('Times in paths are monotonically nondecreasing', async () => {
  });
});
