import { RegisterSession } from 'appdev';
import fs from 'fs';

const LOG_PATH = 'logs';

/**
 * Each error code is associated with a HTTP status code, message, and/or classification substrings
 * and other data (optionally).
 *
 * We use error substrings to classify common errors so that the frontend can identify the cause,
 * respond, and/or notify the user as needed without requiring changes to the backend.
 *
 * https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 *
 * Add new error codes here as needed.
 *
 * {
 *      ERROR_CODE_EXAMPLE: {
 *          status: 404,
 *          substrings: ['error substring for classification via pattern matching', 'another substr'],
 *          message: 'a description of the error provided to the client/user',
 *      },
 * }
 *
 */
const ErrorCodes = Object.freeze({
    /* Error or message is unknown/unclassified. */
    UNCLASSIFIED: {
        status: 500,
    },
    /* Route navigation is to or from a point outside of the graphhopper-defined boundary. */
    OUT_OF_BOUNDS: {
        status: 400,
        substrings: ['out of bounds'],
        message: 'Navigation destination or origin out of bounds.',
    },
    /* Route is too long. Maximum nodes in navigation graph exceeded. */
    MAX_NODES_EXCEEDED: {
        status: 507,
        substrings: ['maximum number of nodes exceeded'],
        message: 'Maximum route size exceeded, try a shorter route.',
    },
    /* Could not find a route. */
    NO_ROUTE_FOUND: {
        status: 500,
        substrings: ['no route found'],
        message: 'No route found.',
    },
    /* Request authentication error. */
    AUTH_FAILED: {
        status: 503,
        substrings: ['401'],
        message: 'Request authentication failed.',
    },
    /* Malformed or invalid request formation error. */
    BAD_REQUEST: {
        status: 503,
        substrings: ['400'],
        message: 'Malformed or invalid request formation error.',
    },
});

const secretKey = process.env.REGISTER_TOKEN || '';
const register = new RegisterSession('http://register.cornellappdev.com', secretKey, 5);

/**
 * Classify an error code from string
 * Returns a spread error code object
 *
 * @param message
 * @returns {{ code:'*', ...(ErrorCodes.*) }}
 */
function classifyError(message: string) {
    const messageStr = message.toString().toLowerCase();
    const errorCode = (Object.entries(ErrorCodes).find(([code, info]) => {
        if (info.substrings) {
            return (info.substrings.find(substring => messageStr.includes(substring)));
        }
        return false;
    })) || ['UNKNOWN', ErrorCodes.UNCLASSIFIED];

    return { code: errorCode[0], ...(errorCode[1]) };
}

/**
 * Classifies error and generates error message for the client
 * @param error
 * @returns {{error: *, message: *}}
 */
function generateErrorResponse(error: string) {
    return {
        ...classifyError(error),
        error,
    };
}

/**
 * Write message to register
 * @param eventType
 * @param payload
 */
function writeToRegister(eventType: string, payload: Object) {
    register.logEvent(eventType, payload);
}

/**
 * Get stack trace at this location
 * @returns {*}
 */
function getStackTrace() {
    return Error().stack || (() => {
        const obj = {};
        Error.captureStackTrace(obj, getStackTrace);
        return obj.stack;
    });
}

/**
 * Log to register if production environment
 * or console if dev environment
 * @param error
 * @param data
 * @param note
 * @param stackTrace
 * @returns {*}
 */
function logErr(error: string, data: ?Object, note: ?string, showStackTrace: ?boolean = true) {
    try { // try block because if the error logging has an error... ?
        if (!error) {
            return null;
        }

        const errorStr = error.toString();
        const stackTrace = showStackTrace && (error.stack || getStackTrace());

        const response = generateErrorResponse(errorStr);

        const env = process.env.NODE_ENV || 'development';

        const registerPayload = {
            ...response,
            ...(data ? { requestParameters: data } : {}),
            ...(note ? { note } : {}),
        };

        if (env === 'production') {
            writeToRegister(
                response.code,
                JSON.stringify({
                    registerPayload,
                    stackTrace,
                }, null, '\t'),
            );
        } else {
            // eslint-disable-next-line no-console
            console.error(`${JSON.stringify(registerPayload, null, '\t')}\n${showStackTrace && stackTrace}`);
        }

        return response;
    } catch (e) {
        return error;
    }
}

/**
 * Log to file at the given location. No need to stringify
 * @param fileName
 * @param data
 */
function logToFile(fileName: string, data: ?Object) {
    fs.writeFile(
        `${LOG_PATH}/${fileName}`,
        (typeof data === 'string') ? data : JSON.stringify(data, null, '\t'),
        (err) => {
            if (err) {
                // eslint-disable-next-line no-console
                return console.error(err);
            }
            return true;
        },
    );
}

export default {
    classifyError,
    generateErrorResponse,
    writeToRegister,
    logErr,
    logToFile,
};
