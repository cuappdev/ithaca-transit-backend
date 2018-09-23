// @flow
import request from 'request';
import ErrorUtils from './ErrorUtils';

async function createRequest(options: any, parameters: any, errorMessage: string) {
    let output = null;

    const createdRequest = await new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, parameters, errorMessage);
        return null;
    });

    return output;
}

export default {
    createRequest,
};