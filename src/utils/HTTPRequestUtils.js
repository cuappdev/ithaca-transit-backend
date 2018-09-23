// @flow
import request from 'request';
import ErrorUtils from './ErrorUtils';

export default {
    createRequest,
};

async function createRequest(options: any, errorMessage: string) {
    return await new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, options, errorMessage);
        return null;
    });
}