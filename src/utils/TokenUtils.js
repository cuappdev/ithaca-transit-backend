// @flow
import fs from 'fs';
import request from 'request';
import dotenv from 'dotenv';
import ErrorUtils from './ErrorUtils';

dotenv.load();

let credentials = { basic_token: process.env.TOKEN || null, access_token: null, expiry_date: null };

const configFile = 'config.json';

const authHeader = getAuthorizationHeader();

async function getCredentials() {
    if (!credentials.basic_token || credentials.basic_token === 'token') {
        credentials.basic_token = process.env.TOKEN || null;

        throw new Error(
            ErrorUtils.log(
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

async function generateAccessToken() {
    await getCredentials();

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
        console.log('tokenRequest');
        console.log(tokenRequest);
        const token = JSON.parse(tokenRequest);
        console.log('token');
        console.log(token);
        const currentDate = new Date();
        const newCredentials = {
            basic_token: credentials.basic_token,
            access_token: token.access_token,
            expiry_date: token.expires_in && new Date(currentDate.getTime() + token.expires_in * 1000),
        };

        if (newCredentials && newCredentials.basic_token) {
            credentials = newCredentials;
            console.log('credentials');
            console.log(credentials);
            fs.writeFile(configFile, JSON.stringify(newCredentials), 'utf8', (err) => {
                if (err) ErrorUtils.log(err, null, 'Could not write access token');
            });
        }

        return newCredentials.access_token;
    }).catch((error) => {
        ErrorUtils.log(error, null, 'Token request failed');
        return null;
    });
}

async function getAuthorizationHeader() {
    await getCredentials();

    if (isAccessTokenExpired()) { // else get from API
        await generateAccessToken();
    }

    if (credentials.access_token) {
        return `Bearer ${credentials.access_token}`;
    }
    throw new Error(`Access token ${credentials.access_token || 'unknown'}`);
}

export default {
    authHeader,
};
