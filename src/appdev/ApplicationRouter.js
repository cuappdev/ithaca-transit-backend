// @flow
import {
    NextFunction, Request, Response, Router,
} from 'express';
import AppDevUtilities from './ApplicationUtils';
import LogUtils from '../utils/LogUtils';

/**
 * RequestType - the HTTP methods supported by AppDevRouter
 */
export type RequestType = 'GET' | 'POST' | 'DELETE';

/**
 * AppDevResponse - the response from an HTTP request
 *
 * Wraps a `success` field around the response data
 */
class AppDevResponse<T> {
    success: boolean;

    data: T;

    constructor(success: boolean, data: T) {
        this.success = success;
        this.data = data;
    }
}

/**
 * AppDevRouter - cleanly create an Express Router object using inheritance
 *
 * Subclasses can simply specify the HTTP method, the path, and a response
 * hook to compute response data. This pattern is cleaner than raw Express
 * Router initialization with callbacks.
 */
class ApplicationRouter<T> {
    router: Router;

    requestTypes: Array<RequestType>;

    /**
     * Subclasses must call this constructor and pass in the HTTP method
     */
    constructor(types: Array<RequestType>) {
        this.router = new Router();
        this.requestTypes = types;

        // Initialize this router
        this.init();
    }

    /**
     * Initialize the Express Router using the specified path and response hook
     * implementation.
     */
    init() {
        const path = this.getPath();

        // Make sure path conforms to specification
        AppDevUtilities.tryCheckAppDevURL(path);

        // Attach content to router
        this.requestTypes.forEach((reqType) => {
            switch (reqType) {
                case 'GET':
                    this.router.get(path, this.response());
                    break;
                case 'POST':
                    this.router.post(path, this.response());
                    break;
                case 'DELETE':
                    this.router.delete(path, this.response());
                    break;
                default:
                    throw new Error('HTTP method not specified!');
            }
        });
    }

    /**
     * Subclasses must override this with the endpoint's URL. Paths must
     * be an AppDev-formatted URL
     */
    getPath(): string {
        throw new Error('You must implement getPath() with a valid path!');
    }

    /**
     * Subclasses must override this response hook to generate response data
     * for the given request.
     */
    // eslint-disable-next-line require-await
    async content(req: Request): Promise<T> {
        throw new Error(1);
    }

    /**
     * Create a wrapper around the response hook to pass to the Express
     * Router.
     */
    response() {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const content = await this.content(req);
                LogUtils.log({ path: this.getPath(), query: req.query, response: content });
                res.json(new AppDevResponse(true, content));
            } catch (e) {
                if (e.message === 1) {
                    throw new Error('You must implement content()!');
                } else {
                    LogUtils.logErr(e, { request: req, response: res }, 'Error in Router.response(...)');
                    res.json(new AppDevResponse(false, { errors: [e.message] }));
                }
            }
            next();
        };
    }
}

export default ApplicationRouter;
