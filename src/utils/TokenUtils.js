// @flow
import fs from 'fs';
import request from 'request';
import dotenv from 'dotenv';
import ErrorUtils from './LogUtils';

dotenv.load();

let credentials = { basic_token: process.env.TOKEN || null, access_token: null, expiry_date: null };

const configFile = 'config.json';

function checkCredentials() {
    if (!credentials.basic_token || credentials.basic_token === 'token') {
        credentials.basic_token = process.env.TOKEN || null;

        throw new Error(
            ErrorUtils.logErr(
                'Invalid or missing TOKEN in .env',
                credentials,
                'getCredentials failed. Missing basic_token',
            ),
        );
    }

    return credentials;
}

function isAccessTokenExpired() {
    if (!credentials.access_token || !credentials.expiry_date) { // we have yet to generate an access token
        return true;
    }
    const currentDate = new Date();
    // 0.5 second expiration buffer
    return (new Date(credentials.expiry_date)).getTime() - 500 < currentDate.getTime();
}

async function fetchAccessToken() {
    checkCredentials();

    if (!credentials.basic_token) {
        throw new Error(`Basic token ${credentials.access_token || 'unknown'}`);
    }

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

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    }).then((tokenRequest: any) => {
        const token = JSON.parse(tokenRequest);
        const currentDate = new Date();
        const newCredentials = {
            basic_token: credentials.basic_token,
            access_token: token.access_token,
            expiry_date: token.expires_in && new Date(currentDate.getTime() + token.expires_in * 1000),
        };

        if (newCredentials && newCredentials.basic_token) {
            credentials = newCredentials;
            fs.writeFile(configFile, JSON.stringify(newCredentials), 'utf8', (err) => {
                if (err) ErrorUtils.logErr(err, null, 'Could not write access token');
            });
        }

        return newCredentials.access_token;
    }).catch((error) => {
        ErrorUtils.logErr(error, credentials, 'Token request failed');
        return null;
    });
}

async function fetchAuthHeader() {
    checkCredentials();

    if (isAccessTokenExpired()) { // else get from API
        await fetchAccessToken();
    }

    if (credentials.access_token) {
        return `Bearer ${credentials.access_token}`;
    }
    throw new Error(`Access token ${credentials.access_token || 'unknown'}`);
}

export default {
    fetchAuthHeader,
};
