// @flow
import dotenv from 'dotenv';

import API from './Api';
import AlertsUtils from './utils/AlertsUtils';
import AllStopUtils from './utils/AllStopUtils';
import GhopperUtils from './utils/GraphhopperUtils';
import ErrorUtils from './utils/LogUtils';
import RealtimeFeedUtils from './utils/RealtimeFeedUtils';
import TokenUtils from './utils/TokenUtils';

dotenv.config(); // dotenv needs to be configured before token fetch
console.log('\x1b[36m%s\x1b[0m', 'Initializing data and waiting for Graphhopper services...');

const PORT: number = parseInt(process.env.PORT) || 80;
const SERVER_ADDRESS: string = '0.0.0.0';

const authToken = TokenUtils.fetchAuthHeader();

const app = new API();
const server = app.getServer(false);
const { express } = app;

/* eslint-disable no-console */
const init = new Promise((resolve, reject) => {
    // start endpoints that rely on external data starting with authentication token
    authToken.then(() => {
        // await data
        const dataInit = Promise.all([
            RealtimeFeedUtils.realtimeFeed,
            AllStopUtils.allStops,
            AlertsUtils.alerts,
            TokenUtils.fetchAuthHeader(),
        ]).then(() => {
            console.log('Initialized data successfully: authHeader, realtimeFeed, allStops, alerts');
        });

        // await full initialization then listen on the port
        Promise.all([
            dataInit,
            GhopperUtils.ghopperReady,
        ]).then(() => {
            server.listen(PORT, SERVER_ADDRESS, () => {
                console.log('\x1b[36m%s\x1b[0m',
                    'Initialized Graphhopper and all data successfully!\n'
                                + `Transit Backend listening on ${SERVER_ADDRESS}:${PORT}`);
                resolve(PORT);
            });
        });
    });
}).then(value => value).catch((error) => {
    ErrorUtils.logErr(error, null, 'Transit init failed');
    return null;
});

export { server, init, express };
