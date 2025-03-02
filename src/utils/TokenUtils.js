import request from 'request';

import { TOKEN } from './EnvUtils.js';
import LogUtils from './LogUtils.js';

const TOKEN_EXPIRATION_WINDOW_IN_MS = 500;
let credentials = { basic_token: TOKEN, access_token: '', expiration_date: '' };

function isAccessTokenExpired() {
  if (credentials.access_token === '') { // need to generate token
    return true;
  }

  const currentTime = new Date().getTime();
  const tokenExpirationTime = (new Date(credentials.expiration_date)).getTime();
  return tokenExpirationTime - currentTime < TOKEN_EXPIRATION_WINDOW_IN_MS;
}

function fetchAccessToken() {
  if (!credentials.basic_token) {
    throw new Error(`Basic token ${credentials.access_token || 'unknown'}`);
  }

  const basicAuthHeader = `Basic ${credentials.basic_token}`;
  const options = {
    method: 'POST',
    url: 'https://gateway.api.cloud.wso2.com:443/token',
    qs: { grant_type: 'client_credentials' },
    headers: {
      Authorization: basicAuthHeader,
      'Postman-Token': '42201611-965d-4832-a4c5-060ad3ff3b83',
      'Cache-Control': 'no-cache',
    },
  };

  new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) reject(error);
      resolve(body);
    });
  }).then((tokenRequest) => {
    const token = JSON.parse(tokenRequest);
    const currentDate = new Date();
    const newCredentials = {
      basic_token: credentials.basic_token,
      access_token: token.access_token,
      expiration_date: token.expires_in && new Date(currentDate.getTime() + token.expires_in * 1000),
    };

    if (newCredentials && newCredentials.basic_token) {
      credentials = newCredentials;
    }
  }).catch((error) => {
    LogUtils.logErr(error, credentials, 'Token request failed');
  });
}

async function fetchAuthHeader() {
  if (isAccessTokenExpired()) await fetchAccessToken();
  return `Bearer ${credentials.access_token}`;
}

export default {
  fetchAuthHeader,
};
