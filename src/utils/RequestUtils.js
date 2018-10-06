// @flow
import request from 'request';
import ErrorUtils from './ErrorUtils';

async function createRequest(options: any, errorMessage: ?string = 'Request failed', verbose: ?boolean = false) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (verbose) {
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
            return fn();
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
