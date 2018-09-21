// @flow
import dotenv from 'dotenv';
import fs from 'fs';
import AlertsUtils from './utils/AlertsUtils';
import AllStopUtils from './utils/AllStopUtils';
import API from './Api';
import RealtimeFeedUtils from './utils/RealtimeFeedUtils';
import TCATUtils from './utils/TCATUtils';
import ErrorUtils from './utils/ErrorUtils';

TCATUtils.createRouteJson('routes.txt');
dotenv.config();

const port: number = parseInt(process.env.PORT) || 80;
const token = process.env.TOKEN;

writeToConfigFile() // make sure we write to config file first
    .then(() => {
        RealtimeFeedUtils.start();
        AllStopUtils.start(); // needs to happen after we write to config file
        AlertsUtils.start();
    })
    .catch((err) => {
        throw err;
    });

const server = new API().getServer();

const init = new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
        resolve('init');
    });
}).then(value => value).catch((error) => {
    ErrorUtils.log(error, null, 'Server init failed');
    return null;
});

function writeToConfigFile() {
    return new Promise(((resolve, reject) => {
        fs.writeFile('config.json', JSON.stringify({ basic_token: token }), (err) => {
            if (err) {
                reject(err);
            }
            resolve(true);
        });
    }));
}

export { server, init };
