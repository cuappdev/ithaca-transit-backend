// @flow
import dotenv from 'dotenv';
import http from 'http';

import API from './API';
import Constants from './utils/Constants';
import LogUtils from './utils/LogUtils';
import TokenUtils from './utils/TokenUtils';

// BEGIN STARTUP CODE

dotenv.config();
LogUtils.log({ message: 'server.js: Initializing data and waiting for Graphhopper services...' });

TokenUtils.fetchAuthHeader();

const app: API = new API();
const server: http.Server = http.createServer(app.express);

server.listen(Constants.PORT, Constants.SERVER_ADDRESS, () => {
  LogUtils.log({ message: `server.js: listening on ${Constants.SERVER_ADDRESS}:${Constants.PORT}` });
});
