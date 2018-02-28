// @flow
import {Router, Request, Response, NextFunction} from 'express';

type ExpressHandlerFunction = (Request, Response, NextFunction) => any;

class AbstractRouter {

    router: Router;
    wrapsResponse: boolean;

    constructor(method: string, path: string, wrapsResponse: boolean) {
        if (!method) throw new Error("Must supply HTTP request method to AbstractRouter");
        if (!path) throw new Error("Must supply HTTP endpoint path to AbstractRouter");
        this.wrapsResponse = wrapsResponse;
        this.router = new Router();
        this.router[method.toLowerCase()](path, this.response());
    }

    async content(request: Request): Promise<any> {
        throw new Error("Must implement content() for AbstractRouter");
    }

    response(): ExpressHandlerFunction {
        return async (request: Request, response: Response, next: NextFunction) => {
            try {
                response.set('Content-Type', 'application/json');
                const data = await this.content(request);
                if (this.wrapsResponse) {
                    response.send({success: true, data: data});
                } else {
                    response.send(data);
                }
            } catch (err) {
                if (this.wrapsResponse) {
                    response.send({success: false, error: err.message});
                } else {
                    response.send(err.message);
                }
                throw err;
            }
        };
    }
}

export default AbstractRouter;
