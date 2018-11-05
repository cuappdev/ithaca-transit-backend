/* eslint-disable no-console */
import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import { ParquetSchema } from 'parquetjs';
import ChronicleSession from '../appdev/ChronicleSession';

dotenv.load();
const CHRONICLE_PROD_ENV = 'production';
const CHRONICLE_DEV_ENV = 'development';
const CHRONICLE_APP_NAME = 'IthacaTransit';
const LOG_REMOTE_ONLY = process.env.NODE_ENV && process.env.NODE_ENV === CHRONICLE_PROD_ENV;
const CHRONICLE_ENV = LOG_REMOTE_ONLY ? CHRONICLE_PROD_ENV : CHRONICLE_DEV_ENV;
const LOG_PATH = 'logs'; // path to local log files

const chronicleTransit = new ChronicleSession(
    process.env.CHRONICLE_ACCESS_KEY,
    process.env.CHRONICLE_SECRET_KEY,
    CHRONICLE_APP_NAME,
);

// define common parquet types
const time = { type: 'TIMESTAMP_MILLIS' }; // INT64 - epoch time
const boolean = { type: 'BOOLEAN' }; // BOOLEAN
const string = { type: 'UTF8' }; // BYTE_ARRAY
const float = { type: 'FLOAT' }; // FLOAT32 - is within 1.7m lat/long precision
const JSON = { type: 'JSON' }; // BYTE_ARRAY - encoded JSON obj
const int = { type: 'INT32' }; // INT32

// define common nested row types
const pointObj: ParquetSchema = { lat: float, long: float }; // lat long point object

const path: ParquetSchema = { repeated: true, fields: pointObj }; // array of points is a path

const boundingBox: ParquetSchema = {
    maxLat: float,
    maxLong: float,
    minLat: float,
    minLong: float,
};

const uid: ParquetSchema = { type: 'UTF8', optional: true }; // optional anonymous user id

const stop: ParquetSchema = { name: string, id: string };

const direction: ParquetSchema = {
    dirType: string,
    name: string,
    startTime: time,
    endTime: time,
    startLocation: pointObj,
    endLocation: pointObj,
    path,
    distance: float,
    routeNumber: { optional: true, type: 'INT32' },
    stops: { repeated: true, fields: stop },
    stayOnBusForTransfer: boolean,
    tripIdentifiers: { optional: true, repeated: true, fields: string },
    delay: { optional: true, type: 'INT32' },
};

// route request schema
const routeRequestSchema: ParquetSchema = {
    uid,
    start: pointObj,
    end: pointObj,
    time,
    arriveBy: boolean,
    destinationName: string,
};

// route result schema
const routeResultSchema: ParquetSchema = {
    uid,
    departureTime: time,
    arrivalTime: time,
    directions: { repeated: true, fields: direction },
    startCoords: pointObj,
    endCoords: pointObj,
    boundingBox,
    numberOfTransfers: int,
};

// user selection table
const userSelectionSchema: ParquetSchema = {
    uid,
    arrivalTime: time, // arrivalTime of a route is basically route ID
};

// cache hits/misses for Google places
const cacheSchema: ParquetSchema = {
    time,
    hit: boolean,
};

const errorSchema: ParquetSchema = {
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
            date: Date.now(),
            error,
            ...(data ? { requestParameters: data } : {}),
            ...(note ? { note } : {}),
        };

        if (LOG_REMOTE_ONLY) {
            logToChronicle('error', errorSchema, error);
        } else {
            log(responseJSON, true);
            logToChronicle('error', errorSchema, error);
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

function logToChronicle(eventName: string, eventSchema: ParquetSchema, event: Object) {
    return chronicleTransit
        .log(`${CHRONICLE_ENV}/${eventName}`, eventSchema, event)
        .catch((err) => {
            logErr(err, event, `Failed to log to Chronicle ${eventName}`);
        });
}

export default {
    log,
    logErr,
    writeToFile,
    logToChronicle,
    routeRequestSchema,
    routeResultSchema,
    userSelectionSchema,
    cacheSchema,
};
