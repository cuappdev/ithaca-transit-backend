// @flow
import express, {Application, Router, Request, Response, NextFunction} from 'express';

type ExpressHandlerFunction = (Request, Response, NextFunction) => any;

class Api {

    app: Application;

    constructor(root: string, middleware: Array<ExpressHandlerFunction>, routers: Array<Router>) {
        this.app = express();

        for (let i = 0; i < middleware.length; i++) {
            this.app.use(middleware[i]);
        }

        for (let i = 0; i < routers.length; i++) {
            this.app.use(root, routers[i]);
        }
    }
}

export default Api;