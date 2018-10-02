// @flow
import dotenv from 'dotenv';
import waitOn from 'wait-on';
import fs from 'fs';
import AlertsUtils from './utils/AlertsUtils';
import AllStopUtils from './utils/AllStopUtils';
import API from './Api';
import RealtimeFeedUtils from './utils/RealtimeFeedUtils';
import ErrorUtils from './utils/ErrorUtils';
import TokenUtils from './utils/TokenUtils';

// load environment variables
if (!process.env.GHOPPER_BUS && !fs.existsSync('.env')) {
    fs.copyFileSync('env.template', '.env', (err) => {
        if (err) throw ErrorUtils.log(err, '.env', 'Failed to find or create .env file');
    });
}
dotenv.load();

const port: number = parseInt(process.env.PORT) || 80;

const waitOptions = {
    resources: [
        `http://${process.env.GHOPPER_BUS || 'ERROR'}:8988/`,
        `http://${process.env.GHOPPER_WALKING || 'ERROR'}:8987/`,
        `http://${process.env.MAP_MATCHING || 'ERROR'}:8989/`,
    ],
    // timeout: 60000, // timeout in ms, default Infinity
    window: 100, // stabilization time in ms, default 750ms

    log: true, // output progress to stdout
};

const server = new API().getServer();

const init = new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
        TokenUtils.authHeader.then(() => {
            // then wait for graphhopper services
            waitOn(waitOptions, (err) => {
                if (err) {
                    throw ErrorUtils.log(err, waitOptions, 'Failed to connect to graphhopper services');
                }
                // graphhopper is running

                // start endpoints that cache data
                RealtimeFeedUtils.start();
                AllStopUtils.start();
                AlertsUtils.start();

                resolve(port);
            });
        });
    });
}).then(value => value).catch((error) => {
    ErrorUtils.log(error, null, 'Transit init failed');
    return null;
});

export { server, init };
