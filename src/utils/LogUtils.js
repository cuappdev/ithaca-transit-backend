// @flow
import fs from 'fs';
import { ParquetSchema } from 'parquetjs';
import util from 'util';

import {
    CHRONICLE_ACCESS_KEY,
    CHRONICLE_SECRET_KEY,
    NODE_ENV,
} from './EnvUtils';
import ChronicleSession from '../appdev/ChronicleSession';
import Schemas from './Schemas';

const CHRONICLE_PROD_ENV = 'production';
const CHRONICLE_DEV_ENV = 'development';
const CHRONICLE_APP_NAME = 'IthacaTransit';
const IS_PROD_ENV = NODE_ENV && NODE_ENV === CHRONICLE_PROD_ENV;
const CHRONICLE_ENV = IS_PROD_ENV ? CHRONICLE_PROD_ENV : CHRONICLE_DEV_ENV;
const LOG_PATH = 'logs'; // path to local log files
const CHRONICLE_CACHE_SIZE = IS_PROD_ENV ? 25 : 0;

const chronicleTransit = new ChronicleSession(
    CHRONICLE_ACCESS_KEY,
    CHRONICLE_SECRET_KEY,
    CHRONICLE_APP_NAME,
    CHRONICLE_CACHE_SIZE,
);

/**
 * Log to file at the given location. No need to stringify.
 * Any existing file at location will be overwritten
 * @param fileName
 * @param data
 */
async function writeToFile(fileName: string, data: ?Object) {
    return fs.writeFile(
        `${LOG_PATH}/${fileName}`,
        ((typeof data === 'string') ? data : JSON.stringify((await data), null, '\t')),
        (err) => {
            if (err) {
                // eslint-disable-next-line no-console
                return logErr(err, data, `Could not log to file ${fileName}`);
            }
            return true;
        },
    );
}

/**
 * Write object to console
 * @param obj
 * @param error
 */
function log(obj: Object, error: ?boolean = false) {
    // register.logEvent(eventType, payload);
    const options = {
        showHidden: false,
        depth: null,
        colors: true,
        maxArrayLength: 10,
        breakLength: Infinity,
        compact: false,
    };

    if (error) {
        console.error(util.inspect(obj, options));
    } else {
        console.log(util.inspect(obj, options));
    }
}

/**
 * Log error to Chronicle if production environment
 * or console if dev environment
 * @param error, the error object
 * @param data, data such as parameters or an object that would help in debugging
 * @param note, description of error
 * @param disableConsoleOut, disable console.out in development env, for tests
 * @returns {*}
 */
function logErr(
    error: Object,
    data: ?Object = '',
    note: ?string = '', //
    disableConsoleOut: ?boolean = false,
) {
    try { // try block because if the error logging has an error... ?
        if (!error) {
            return null;
        }

        const responseJSON = {
            time: Date.now(),
            error,
            data,
            note,
        };

        if (IS_PROD_ENV) {
            logToChronicle('error', Schemas.errorSchema, error, true);
        } else {
            if (!disableConsoleOut) {
                log(responseJSON, true);
            }
            logToChronicle('error', Schemas.errorSchema, error, true);
        }

        return responseJSON;
    } catch (e) {
        return error;
    }
}

function logToChronicle(
    eventName: string,
    parquetSchema: ParquetSchema,
    event: Object,
    disableCache: ?boolean = false,
) {
    return chronicleTransit
        .log(`${CHRONICLE_ENV}/${eventName}`, parquetSchema, event, disableCache)
        .catch((err) => {
            logErr(err, event, `Failed to log to Chronicle ${eventName}`);
        });
}

export default {
    log,
    logErr,
    writeToFile,
    logToChronicle,
};
