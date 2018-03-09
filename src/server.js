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
RealtimeFeedUtils.start()
dotenv.config()

const port: number = parseInt(process.env.PORT) || 80;
const token = process.env.TOKEN;
fs.writeFile("config.json", JSON.stringify({basic_token: token}), function (err) {
    if(err) {
        console.log(err)
    }
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