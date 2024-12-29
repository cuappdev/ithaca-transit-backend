
import interval from 'interval-promise';
import request from 'request';
import util from 'util';

import LogUtils from './LogUtils.js';

function createRequest(
  options,
  errorMessage = 'Request failed',
  verbose = false,
  returnRes = false,
) {
  options.time = true;
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) reject(error);
      if (verbose) {
        console.log(`Elapsed request time ${response.elapsedTime}`);
      }
      if (returnRes) {
        resolve(response);
      }
      resolve(body);
    });
  }).then(value => value).catch((error) => {
    LogUtils.logErr(error, options, errorMessage);
    return null;
  });
}

/**
 * Attempts to call [fn] [retryCount] times. Only if an exception occurs [retryCount] times, throw the exception.
 * Else returns the result of [fn].
 *
 * @param {() => any} fn
 * @param {number} retryCount
 * @returns {any} The result of [fn]
 */
async function fetchWithRetry(fn, retryCount = 5) {
  let error;
  for (let i = 0; i < retryCount; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return (await fn());
    } catch (err) {
      error = err;
    }
  }
  throw error;
}

/**
 * Calls [fn] every [refreshInterval], where [fn] must complete before [timeout].
 * If [fn] completes successfully, [objectToUpdate] is set to the value of [fn()].
 *
 * @param {() => Object} fn
 * @param {number} refreshInterval Ms to wait before refresh
 * @param {number} timeout Ms to wait before request times out
 * @param {Object} objectToUpdate
 */
function updateObjectOnInterval(
  fn,
  refreshInterval,
  timeout,
  objectToUpdate,
) {
  interval(async (iteration, stop) => {
    try {
      const optionalUpdatedObject = await Promise.race([
        fn(),
        (util.promisify(setTimeout))(timeout)
          .then(() => null),
      ]);

      if (optionalUpdatedObject != null) { // eslint-disable-next-line no-param-reassign
        objectToUpdate = optionalUpdatedObject;
      }
    } catch (error) {
      LogUtils.logErr(error, objectToUpdate, 'Error occurred while in repeated interval');
    }
  }, refreshInterval, { stopOnError: false });
}

export default {
  createRequest,
  fetchWithRetry,
  updateObjectOnInterval,
};
