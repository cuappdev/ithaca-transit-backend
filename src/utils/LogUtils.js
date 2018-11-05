/* eslint-disable no-console */
import fs from 'fs';
import util from 'util';
import rfs from 'rotating-file-stream';
import ChronicleSession from '../appdev/ChronicleSession';

const LOG_REMOTELY = process.env.NODE_ENV && process.env.NODE_ENV === 'production';

const LOG_PATH = 'logs'; // path to log files
const LOG_DATA_PATH = `${LOG_PATH}/data`; // path to data log files
const APPLICATION_LOG_FILE = '.app.log'; // general output file name

// Log data to file instead of remote AWS/Chronicle when not in production mode
const logStream = rfs(APPLICATION_LOG_FILE, {
    path: LOG_DATA_PATH, // path to data log files
    size: '1M', // rotate every 1 megabytes written
    interval: '1d', // rotate daily
    compress: true, // compress rotated files
});

const chronicleTransit = new ChronicleSession(
    process.env.CHRONICLE_ACCESS_KEY,
    process.env.CHRONICLE_SECRET_KEY,
    'IthacaTransit',
);

// define common parquet schema types
const uid = { type: 'UTF8' }; // anonymous user id
const time = { type: 'TIMESTAMP_MILLIS' }; // epoch time, new Date()
const point = { type: 'UTF8' }; // point, string with comma separated latitude and longitude
const boolean = { type: 'BOOLEAN' };
const string = { type: 'UTF8' }; // string
const JSON = { type: 'JSON' }; // generic object in JSON format

// request schema
const routeRequestSchema = {
    uid,
    start: point,
    end: point,
    time,
    arriveBy: boolean,
    destinationName: string,
};

const shortRoutes = {
    rid: { type: 'INT64' },
};

const routeResultSchema = {

};

// user selection table
const userSelectionSchema = {
    uid,
    // start, dest names, route times, etc
    rids: { type: 'LIST' },
};

// cache hits/misses for Google places
const cacheSchema = {
    time,
    hit: boolean,
};

const errorSchema = {
    time,
    error: JSON,
    data: JSON,
    note: string,
};

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
 * @param error
 * @param data
 * @param note
 * @param showStackTrace
 * @returns {*}
 */
function logErr(error: Object, data: ?Object, note: ?string, showStackTrace: ?boolean = true) {
    try { // try block because if the error logging has an error... ?
        if (!error) {
            return null;
        }

        const responseJSON = {
            error,
            ...(data ? { requestParameters: data } : {}),
            ...(note ? { note } : {}),
        };

        if (LOG_REMOTELY) {
            logToChronicle(error, data, note);
        } else {
            log(responseJSON, true);
        }

        return responseJSON;
    } catch (e) {
        return error;
    }
}

/**
 * Log to file at the given location. No need to stringify.
 * Any existing file at location will be overwritten
 * @param fileName
 * @param data
 */
async function logToFile(fileName: string, data: ?Object) {
    try {
        await fs.writeFile(
            `${LOG_PATH}/${fileName}`,
            (typeof data === 'string') ? data : JSON.stringify((await data), null, '\t'),
            (err) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    return console.error(err);
                }
                return true;
            },
        );
    } catch (e) {
        return logErr(e, data, `Could not log to file ${fileName}`);
    }
    return false;
}

async function logToChronicle(error: Object, data: ?Object, note: ?string) {
    console.log('logging remotely');
}

export default {
    log,
    logErr,
    logToFile,
    logToChronicle,
};
