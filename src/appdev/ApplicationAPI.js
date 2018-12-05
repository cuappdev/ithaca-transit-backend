// @flow
import http from 'http';
import express, {
    Application, NextFunction, Request, Response,
} from 'express';
import AppDevUtilities from './ApplicationUtils';
import LogUtils from '../utils/LogUtils';

/**
 * ExpressHandlerFunction - the function signature of callbacks for Express
 * Router objects
 */
export type ExpressCallback = (Request, Response, NextFunction) => any;

/**
 * AppDevAPI - create an Express Application object from a series of middleware
 * and routers
 *
 * Subclasses can specify the middleware and routers required for implementing
 * the backend's API. This pattern is cleaner than than raw Express Application
 * initialization with middleware functions and routers.
 */
class ApplicationAPI {
    express: Application;

    /**
     * Subclasses must call this constructor to set up the API
     */
    constructor() {
        this.express = express();
        this.init();
    }

    /**
     * Initialize the Express Application object using the middleware
     * and routers provided by the subclass.
     */
    init() {
        AppDevUtilities.tryCheckAppDevURL(this.getPath());
        const middleware = this.middleware();
        const routerGroups = this.routerGroups();
        for (let i = 0; i < middleware.length; i++) {
            this.express.use(middleware[i]);
        }

        Object.keys(routerGroups).forEach((version) => {
            const routers = routerGroups[version];
            for (let i = 0; i < routers.length; i++) {
                this.express.use(this.getPath() + version, routers[i]);
            }
        });
    }

    /**
     * Subclasses must override this with the API's URL. Paths must
     * be an AppDev-formatted URL.
     */
    getPath(): string {
        return '/';
    }

    /**
     * Subclasses must override this to supply middleware for the API.
     */
    middleware(): ExpressCallback[] {
        return [];
    }

    /**
     * Subclasses must override this to supply middleware for the API.
     */
    routerGroups(): Object {
        return {};
    }

    /**
     * Get an HTTP server backed by the Express Application
     */
    getServer(verbose: ?boolean = true): http.Server {
        const server: http.Server = http.createServer(this.express);
        const onError = (err: Error): void => {
            // eslint-disable-next-line no-console
            LogUtils.logErr(err, 'server', 'Application error');
        };

        const onListening = (): void => {
            if (verbose) {
                // eslint-disable-next-line no-console
                console.log(`Listening on ${server.address().address}:${server.address().port}`);
            }
        };

        server.on('error', onError);
        server.on('listening', onListening);
        return server;
    }
}

export default ApplicationAPI;
