// @flow
import request from 'request';
import ErrorUtils from './ErrorUtils';

async function createRequest(options: any, errorMessage: string, verbose: ?boolean = false) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (verbose) {
                resolve(response);
            }
            resolve(body);
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, options, errorMessage);
        return null;
    });
}

export default {
    createRequest,
};
