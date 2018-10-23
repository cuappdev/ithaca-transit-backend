// @flow
import request from 'request';
import ErrorUtils from './LogUtils';

function createRequest(options: any, errorMessage: ?string = 'Request failed', verbose: ?boolean = false, returnRes: ?boolean = false) {
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
        ErrorUtils.logErr(error, options, errorMessage);
        return null;
    });
}

async function fetchRetry(fn, n = 5) {
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

export default {
    createRequest,
    fetchRetry,
};
