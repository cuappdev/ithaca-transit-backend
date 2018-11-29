// @flow
import dotenv from 'dotenv';
import fs from 'fs';
import AlertsUtils from './utils/AlertsUtils';
import AllStopUtils from './utils/AllStopUtils';
import API from './Api';
import RealtimeFeedUtils from './utils/RealtimeFeedUtils';
import ErrorUtils from './utils/LogUtils';
import TokenUtils from './utils/TokenUtils';
import GhopperUtils from './utils/GraphhopperUtils';

// eslint-disable-next-line no-console
console.log('\x1b[36m%s\x1b[0m', 'Initializing data and waiting for Graphhopper services...');

// load environment variables
if (!process.env.GHOPPER_BUS && !fs.existsSync('.env')) {
    try {
        fs.copyFileSync('env.template', '.env');
    } catch (err) {
        throw ErrorUtils.logErr(err, '.env', 'Failed to find or create .env file');
    }
}
dotenv.load();

const port: number = parseInt(process.env.PORT) || 80;
const address: string = '0.0.0.0';

const authToken = TokenUtils.fetchAuthHeader();

const app = new API();
const server = app.getServer(false);
const { express } = app;

/* eslint-disable no-console */
const init = new Promise((resolve, reject) => {
    // start endpoints that rely on external data starting with authentication token
    authToken.then(() => {
        RealtimeFeedUtils.start();
        AllStopUtils.start();
        AlertsUtils.start();

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
            server.listen(port, address, () => {
                console.log('\x1b[36m%s\x1b[0m',
                    'Initialized Graphhopper and all data successfully!\n'
                                + `Transit Backend listening on ${address}:${port}`);
                resolve(port);
            });
        });
    });
}).then(value => value).catch((error) => {
    ErrorUtils.logErr(error, null, 'Transit init failed');
    return null;
});

export { server, init, express };
