// @flow
import dotenv from 'dotenv';
import http from 'http';

import API from './API';
import LogUtils from './utils/LogUtils';
import TokenUtils from './utils/TokenUtils';

// BEGIN STARTUP CODE
const PORT: number = parseInt(process.env.PORT) || 80;
const SERVER_ADDRESS: string = '0.0.0.0';

dotenv.config();
LogUtils.log({ message: 'server.js: Initializing data and waiting for Graphhopper services...' });

TokenUtils.fetchAuthHeader();

const app: API = new API();
const server: http.Server = http.createServer(app.express);

server.listen(PORT, SERVER_ADDRESS, () => {
  LogUtils.log({ message: `server.js: listening on ${SERVER_ADDRESS}:${PORT}` });
});
