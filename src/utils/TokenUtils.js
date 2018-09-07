// @flow
import fs from 'fs';
import request from 'request';
import ErrorUtils from './ErrorUtils';

let basicToken = null;
let accessToken = null;
let expiryDate = null;

async function getCredentials() {
    let credentials;

    if (!basicToken) {
        credentials = await (JSON.parse(fs.readFileSync('config.json', 'utf8')))
            || fs.readFile('file', 'utf8', (err, data) => {
                if (err) ErrorUtils.log(err, null, 'Could not get credentials from file');
                return JSON.parse(data);
            });

        accessToken = credentials.access_token || null;
        expiryDate = credentials.expiry_date || null;
        basicToken = credentials.basic_token || null;
    }

    credentials = { basic_token: basicToken, access_token: accessToken, expiry_date: expiryDate };

    return credentials;
}

function isAccessTokenExpired() {
    if (!accessToken || !expiryDate) { // we have yet to generate an access token
        return true;
    }
    const currentDate = new Date();
    // 0.5 second expiration buffer
    return (new Date(expiryDate)).getTime() - 500 < currentDate.getTime();
}

async function generateAccessToken() {
    const credentials = await getCredentials();

    const basicAuthHeader = `Basic ${credentials.basic_token}`;

    const options = {
        method: 'POST',
        url: 'https://gateway.api.cloud.wso2.com:443/token',
        qs: { grant_type: 'client_credentials' },
        headers:
                {
                    'Postman-Token': '42201611-965d-4832-a4c5-060ad3ff3b83',
                    'Cache-Control': 'no-cache',
                    Authorization: basicAuthHeader,
                },
    };

    const finish = new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    });

    finish.then((tokenRequest: any) => {
        accessToken = tokenRequest;

        console.log('Access token', accessToken);

        const currentDate = new Date();
        const newCredentials = {
            basic_token: credentials.basic_token,
            tokenRequest,
            expiry_date: new Date(currentDate.getTime() + tokenRequest.expires_in * 1000),
        };

        console.log('New credidentials', newCredentials);

        if (newCredentials && newCredentials.basic_token) {
            accessToken = newCredentials.tokenRequest.access_token;
            expiryDate = newCredentials.tokenRequest.expiry_date;

            fs.writeFile('config.json', JSON.stringify(newCredentials), 'utf8', (err) => {
                if (err) ErrorUtils.log(err, null, 'Could not write access token');
            });
        }

        return newCredentials.access_token;
    });

    finish.catch((error) => {
        ErrorUtils.log(error, null, 'Token request failed');
        return null;
    });
}

async function getAuthorizationHeader() {
    const credentials = await getCredentials();

    if (isAccessTokenExpired(credentials)) {
        accessToken = await generateAccessToken();
    } else {
        accessToken = credentials.access_token;
    }

    accessToken = accessToken || credentials.access_token || await generateAccessToken();

    return `Bearer ${accessToken}`;
}

export default {
    getAuthorizationHeader,
};
