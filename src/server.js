// @flow
import http from 'http';
import express, {Application, Request, Response} from 'express';
import HelloWorldRouter from './HelloWorldRouter';
import TrackingRouter from './TrackingRouter';
import RouteRouter from './RouteRouter';
import AllStopsRouter from './AllStopsRouter';
import DelayRouter from './DelayRouter';
import TCATUtils from './TCATUtils';
import RealtimeFeedUtils from './RealtimeFeedUtils';
import AllStopUtils from './AllStopUtils';
import dotenv from 'dotenv';
import fs from 'fs';
import Api from './Api';

const api: Api = new Api('/api/v1', [], [
    HelloWorldRouter,
    TrackingRouter,
    RouteRouter,
    AllStopsRouter,
    DelayRouter
]);

TCATUtils.createRouteJson('routes.txt');
dotenv.config();

const port: number = parseInt(process.env.PORT) || 80;
const token = process.env.TOKEN;

writeToConfigFile() //make sure we write to config file first
.then(success => {
    RealtimeFeedUtils.start();
    AllStopUtils.start(); //needs to happen after we write to config file
})
.catch(err => {
    throw err;
});



const server: http.Server = http.createServer(api.app);

const onError = (err: Error): void => {
    console.log(err);
};

const onListening = (): void => {
    const host = server.address().address;
    console.log(`Listening on ${host}:${port}`);
};

server.on('error', onError);
server.on('listening', onListening);
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