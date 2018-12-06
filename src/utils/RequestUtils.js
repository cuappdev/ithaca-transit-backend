// @flow
import request from 'request';
import interval from 'interval-promise';
import util from 'util';
import LogUtils from './LogUtils';

function createRequest(
    options: any,
    errorMessage: ?string = 'Request failed',
    verbose: ?boolean = false,
    returnRes: ?boolean = false,
) {
    options.time = true;
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (verbose) {
                // eslint-disable-next-line no-console
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

async function fetchRetry(fn: () => void, n: number = 5) {
    let error;
    for (let i = 0; i < n; i++) {
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
 * Calls fn every refreshInterval ms with timeout
 */
function startRequestIntervals(fn, refreshInterval, timeout, setObj) {
    interval(async (iteration, stop) => {
        try {
            const update = await Promise.race([
                fn(),
                (util.promisify(setTimeout))(timeout)
                    .then(() => false),
            ]);

            if (update) {
                // eslint-disable-next-line no-param-reassign
                setObj = update;
            }
        } catch (error) {
            LogUtils.logErr(error, setObj, 'Error occurred while in repeated interval');
        }
    }, refreshInterval, { stopOnError: false });
}

export default {
    createRequest,
    fetchRetry,
    startRequestIntervals,
};
