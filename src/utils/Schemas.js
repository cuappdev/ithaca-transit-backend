import { ParquetSchema } from 'parquetjs';

// define common parquet types
const timeObj = { type: 'TIMESTAMP_MILLIS' }; // INT64 - epoch time
const booleanObj = { type: 'BOOLEAN' }; // BOOLEAN
const stringObj = { type: 'UTF8' }; // BYTE_ARRAY
const floatObj = { type: 'FLOAT' }; // FLOAT32 - is within 1.7m lat/long precision
const JSONObj = { type: 'JSON' }; // BYTE_ARRAY - encoded JSON obj
const intObj = { type: 'INT32' }; // INT32

// reusable complex types
const pointObj = { fields: { lat: floatObj, long: floatObj } };
const uidObj = { type: 'UTF8', optional: true };
const boundingBoxObj = {
    fields: {
        maxLat: floatObj,
        maxLong: floatObj,
        minLat: floatObj,
        minLong: floatObj,
    },
};
const stopsArr = {
    repeated: true,
    fields: {
        name: stringObj,
        id: stringObj,
    },
};
const pathArr = { // array of points is a path
    repeated: true,
    fields: {
        pointObj,
    },
};
const tripIdArr = {
    optional: true,
    repeated: true,
    type: 'UTF8',
};
const directionsArr = {
    repeated: true,
    fields: {
        dirType: stringObj,
        name: stringObj,
        startTime: timeObj,
        endTime: timeObj,
        startLocation: pointObj,
        endLocation: pointObj,
        path: pathArr,
        distance: floatObj,
        routeNumber: {
            optional: true,
            type: 'INT32',
        },
        stops: stopsArr,
        stayOnBusForTransfer: booleanObj,
        tripIdentifiers: tripIdArr,
        delay: {
            optional: true,
            type: 'INT32',
        },
    },
};

// parquet schema objects for remote logging
// define common parquet types
const time = new ParquetSchema({ time: timeObj });
const string = new ParquetSchema({ str: stringObj });
const float = new ParquetSchema({ val: floatObj });
const int = new ParquetSchema({ val: intObj });
const JSON = new ParquetSchema({ obj: JSONObj });

// error and debug info
const errorSchema: ParquetSchema = new ParquetSchema({
    time: timeObj,
    error: JSONObj,
    data: JSONObj,
    note: stringObj,
});

// cache hits/misses for Google places
const cacheSchema: ParquetSchema = new ParquetSchema({
    time: timeObj,
    hit: booleanObj,
});

// route request schema
const routeRequestSchema: ParquetSchema = new ParquetSchema({
    uid: uidObj,
    start: pointObj,
    end: pointObj,
    time: timeObj,
    arriveBy: booleanObj,
    destinationName: stringObj,
});

// route result schema
const routeResultSchemaV1: ParquetSchema = new ParquetSchema({
    uid: uidObj,
    routeId: uidObj,
    departureTime: timeObj,
    arrivalTime: timeObj,
    directions: directionsArr,
    startCoords: pointObj,
    endCoords: pointObj,
    boundingBox: boundingBoxObj,
    numberOfTransfers: intObj,
});

export default {
    errorSchema,
    routeRequestSchema,
    routeResultSchemaV1,
    cacheSchema,
    time,
    string,
    JSON,
    float,
    int,
};
