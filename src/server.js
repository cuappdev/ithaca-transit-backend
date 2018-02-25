// @flow
import http from 'http';
import express, {Application, Request, Response} from 'express';
import HelloWorldRouter from './HelloWorldRouter';
import TrackingRouter from './TrackingRouter';
import RouteRouter from './RouteRouter';
import AllStopsRouter from './AllStopsRouter';

import Api from './Api';

const api: Api = new Api('', [], [
    HelloWorldRouter,
    TrackingRouter,
    RouteRouter,
    AllStopsRouter
]);

const port: number = parseInt(process.env.PORT) || 3000;

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