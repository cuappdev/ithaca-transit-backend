// @flow
import http from 'http';
import TCATUtils from './TCATUtils';
import AlertsRouter from './AlertsRouter';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils';
import AlertsUtils from './AlertsUtils';
import dotenv from 'dotenv';
import fs from 'fs';
import API from './Api';

TCATUtils.createRouteJson('routes.txt');
dotenv.config();

const port: number = parseInt(process.env.PORT) || 80;
const token = process.env.TOKEN;

writeToConfigFile() //make sure we write to config file first
.then(success => {
    RealtimeFeedUtils.start();
    AllStopUtils.start(); //needs to happen after we write to config file
    AlertsUtils.start();
})
.catch(err => {
    throw err;
});

const server = new API().getServer();

server.listen(port);

function writeToConfigFile() {
    return new Promise(function(resolve, reject) {
        fs.writeFile("config.json", JSON.stringify({basic_token: token}), function (err) {
            if(err) {
                reject(err);
            }
            resolve(true);
        });
    });
}