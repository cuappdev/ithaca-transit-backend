// @flow
import dotenv from 'dotenv';
import http from 'http';

import admin from 'firebase-admin';
import API from './API';
import LogUtils from './utils/LogUtils';
import TokenUtils from './utils/TokenUtils';

const PORT: number = parseInt(process.env.PORT) || 80;
const SERVER_ADDRESS: string = '0.0.0.0';

// BEGIN STARTUP CODE

dotenv.config();
LogUtils.log({ message: 'server.js: Initializing data and waiting for Graphhopper services...' });

TokenUtils.fetchAuthHeader();

const app: API = new API();
const server: http.Server = http.createServer(app.express);

server.listen(PORT, SERVER_ADDRESS, () => {
  LogUtils.log({ message: `server.js: listening on ${SERVER_ADDRESS}:${PORT}` });
});

// Setup Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(process.env.FCM_AUTH_KEY_PATH),
  databaseURL: 'https://ithaca-transit.firebaseio.com',
});
