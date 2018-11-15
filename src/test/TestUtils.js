/* eslint-disable no-console */
const moment = require('moment');
const util = require('util');
const jsondiffpatch = require('jsondiffpatch');
const fs = require('fs');
const RequestUtils = require('../utils/RequestUtils.js').default;

const LOG_PATH = 'logs'; // path to log files

// jsondiffpatch config
const JsonDiff = jsondiffpatch.create({
    arrays: {
        // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
        detectMove: true,
        // default false, the value of items moved is not included in deltas
        includeValueOnMove: true,
    },
});

// stringify and/or format a value
function s(v) {
    if (typeof v === 'string') return v;
    if (v) return util.inspect(v); // return JSON.stringify(v, null, '\t');
    if (v === null) return 'null';
    if (typeof v === 'undefined') return 'undefined';
    if (Number.isNaN(v)) return 'NaN';
    return `${typeof v}`;
}

function isNum(num) {
    if (typeof num === 'number') {
        return num - num === 0;
    }
    if (typeof num === 'string' && num.trim() !== '') {
        return Number.isFinite ? Number.isFinite(+num) : Number.isFinite(+num);
    }
    return false;
}

function isCoordsValid(coords) {
    return (
        coords // coords undefined
        && coords.lat
        && coords.long // lat or long undefined
        && isNum(coords.lat)
        && isNum(coords.long) // lat and long are numbers
    );
}

function isDateValid(date) {
    return moment(date).isValid();
}

/**
 * fail message
 */
function fm(msg) {
    return { pass: false, message: () => msg };
}

/**
 * Remove all specified keys from an object, no matter how deep they are.
 * The removal is done in place, so run it on a copy if you don't want to modify the original object.
 * This function has no limit so circular objects will probably crash the browser
 *
 * @param obj The object from where you want to remove the keys
 * @param keys An array of property names (strings) to remove
 */
function removeKeys(obj, keys) {
    let index;
    // eslint-disable-next-line no-restricted-syntax
    for (const prop in obj) {
        // important check that this is objects own property
        // not from prototype prop inherited
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            switch (typeof (obj[prop])) {
                case 'string':
                    index = keys.indexOf(prop);
                    if (index > -1) {
                        delete obj[prop];
                    }
                    break;
                case 'object':
                    index = keys.indexOf(prop);
                    if (index > -1) {
                        delete obj[prop];
                    } else {
                        removeKeys(obj[prop], keys);
                    }
                    break;
                default:
            }
        }
    }
}

async function getReleaseRes(query) {
    const options = {
        method: 'GET',
        url: `${process.env.RELEASE_URL}${query}`,
        qsStringifyOptions: { arrayFormat: 'repeat' },
    };
    return JSON.parse(await RequestUtils.createRequest(options));
}

async function printReleaseDiff(res, query) {
    try {
        const options = {
            method: 'GET',
            url: `${process.env.RELEASE_URL}${query}`,
            qsStringifyOptions: { arrayFormat: 'repeat' },
        };
        const releaseStr = await RequestUtils.createRequest(options);
        const responseStr = JSON.stringify(res);
        if (responseStr !== releaseStr) {
            let releaseJSON;
            try {
                releaseJSON = JSON.parse(releaseStr);
                const responseJSONCopy = JSON.parse(responseStr);
                const delta = JsonDiff.diff(releaseJSON, responseJSONCopy);
                jsondiffpatch.console.log(delta);
            } catch (e) {
                console.log(`WARNING: Current release: ${releaseStr}\nLocal: ${JSON.stringify(res)}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

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
        console.error(e, data, `Could not log to file ${fileName}`);
    }
    return false;
}

const expectTests = {
    toBeValid(res) {
        if (!res) {
            return fm('No response');
        }
        if (!res.statusCode || res.statusCode >= 305) {
            return fm(`Bad response status code: ${s(res.statusCode)}`);
        }
        if (!res.body) {
            return fm(`No response body: ${s(res)}`);
        }
        if (res.body.success === false) {
            return fm(`Request success:false; ${s(res.body)}`);
        }
        if (!res.body.data || res.body.data.length === 0) {
            return fm(`Request data empty: ${s(res.body)}`);
        }

        return { pass: true };
    },
    placesToBeValid(res) {
        if (!res) {
            return fm('No response');
        }
        if (!res.statusCode || res.statusCode >= 305) {
            return fm(`Bad response status code: ${s(res.statusCode)}`);
        }
        if (!res.body) {
            return fm(`No response body: ${s(res)}`);
        }
        if (res.body.success === false) {
            return fm(`Request success:false; ${s(res.body)}`);
        }
        if (!res.body.data || res.body.data.length === 0) {
            return fm(`Request data empty: ${s(res.body)}`);
        }

        const suggestions = res.body.data;

        for (let i = 0; i < suggestions.length; i++) {
            const place = suggestions[i];

            if (!place) {
                return fm(`Place data empty: ${s(suggestions)}`);
            }
            if (!place.name || !place.place_id || !place.address) {
                return fm(`Place data invalid: ${s(place)}`);
            }
        }

        return { pass: true };
    },
    dataToBeValid(res) {
        if (!res) {
            return fm('No response');
        }
        if (!res.statusCode || res.statusCode >= 305) {
            return fm(`Bad response status code: ${s(res.statusCode)}`);
        }
        if (!res.body) {
            return fm(`No response body: ${s(res)}`);
        }
        if (res.body.success === false) {
            return fm(`Request success:false; ${s(res.body)}`);
        }
        if (!res.body.data) {
            return fm(`Request data empty: ${s(res.body)}`);
        }

        return { pass: true };
    },
    delayToBeValid(res) {
        if (!res) {
            return fm('No response');
        }
        if (!res.statusCode || res.statusCode >= 305) {
            return fm(`Bad response status code: ${s(res.statusCode)}`);
        }
        if (!res.body) {
            return fm(`No response body: ${s(res)}`);
        }
        if (res.body.success === false) {
            return fm(`Request success:false; ${s(res.body)}`);
        }

        return { pass: true };
    },
    routeToBeValid(res, trackingBody = new Set(), routeParams = { name: '', warning: false }) {
        if (!res) {
            return fm('No response');
        }
        if (!res.statusCode || res.statusCode >= 305) {
            return fm(`Bad response status code: ${s(res.statusCode)}`);
        }
        if (!res.body) {
            return fm(`No response body: ${s(res)}`);
        }
        if (res.body.success === false) {
            return fm(`Request success:false; ${s(res.body)}`);
        }
        if (!res.body.data || res.body.data.length === 0) {
            return fm(`Request data empty: ${s(res.body)}`);
        }

        let walkingDirs = 0;
        let busDirs = 0;

        for (let i = 0; i < res.body.data.length; i++) {
            const route = res.body.data[i];

            if (!route) {
                return fm(`Route body has empty routes: ${s(route.body)}`);
            }
            if (!(route.departureTime && route.arrivalTime)) {
                return fm(`Route departureTime or arrivalTime empty: ${route.body}`);
            }
            if (!isCoordsValid(route.endCoords)) {
                return fm(`Route endCoords invalid: ${s(route)}`);
            }
            if (!isCoordsValid(route.startCoords)) {
                return fm(`Route startCoords invalid: ${s(route)}`);
            }
            if (!route.boundingBox
                || !(route.boundingBox.minLat
                    && route.boundingBox.minLong
                    && route.boundingBox.maxLat
                    && route.boundingBox.maxLong)) {
                return fm(`Route boundingBox invalid: ${s(route)}`);
            }
            if ((route.numberOfTransfers && !isNum(route.numberOfTransfers)) || route.numberOfTransfers < 0) {
                return fm(`Route numberOfTransfers invalid: ${s(route)}`);
            }

            if (!route.directions || route.directions.length === 0) {
                return fm(`No route directions: ${s(route)}`);
            }

            for (let j = 0; j < route.directions.length; j++) {
                const dir = route.directions[j];
                if (!dir) {
                    return fm(`Directions empty: ${s(route)}`);
                }
                if (!dir.path || !(dir.path.length > 0)) {
                    return fm(`Directions path empty: ${s(dir)}`);
                }
                if (!isCoordsValid(dir.endLocation)) {
                    return fm(`Directions endLocation invalid: ${s(dir)}`);
                }
                if (!isCoordsValid(dir.startLocation)) {
                    return fm(`Directions startLocation invalid: ${s(dir)}`);
                }
                if (!isDateValid(dir.startTime)) {
                    return fm(`Directions startTime invalid: ${s(dir)}`);
                }
                if (!isDateValid(dir.endTime)) {
                    return fm(`Directions endTime invalid: ${s(dir)}`);
                }
                if (!dir.name) {
                    return fm(`Directions name invalid: ${s(dir)}`);
                }
                if (!dir.distance || !isNum(dir.distance)) {
                    return fm(`Directions distance invalid: ${s(dir)}`);
                }
                if (!dir.type || !(dir.type === 'walk' || dir.type === 'depart')) {
                    return fm(`Directions type invalid: ${s(dir)}`);
                }

                if (dir.type === 'walk') {
                    walkingDirs += 1;
                    if ((dir.stops && dir.stops.length > 0)
                        || dir.stayOnBusForTransfer
                        || dir.routeNumber
                        || dir.delay
                        || dir.tripIdentifiers
                    ) {
                        return fm(`Directions walk data invalid: ${s(dir)}`);
                    }
                } else { // type === 'depart'
                    busDirs += 1;
                    if (!dir.routeNumber || dir.routeNumber === 0 || !(typeof dir.routeNumber === 'number')) {
                        return fm(`Directions routeNumber invalid: ${s(dir)}`);
                    }
                    if (!dir.stops || dir.stops.length === 0) {
                        return fm(`Directions stops invalid: ${s(dir)}`);
                    }
                    if (!dir.tripIdentifiers) {
                        return fm(`Directions tripIdentifiers invalid: ${s(dir)}`);
                    }

                    for (let k = 0; k < dir.stops.length; k++) {
                        const stop = dir.stops[k];

                        if (!isCoordsValid(stop)) {
                            return fm(`Stops coordinates invalid: ${s(dir)}`);
                        }
                        if (!stop.stopID || !isNum(stop.stopID)) {
                            return fm(`Stops stopID invalid: ${s(dir)}`);
                        }

                        trackingBody.add({
                            stopID: stop.stopID,
                            routeID: dir.routeNumber,
                            tripIdentifiers: dir.tripIdentifiers,
                        });

                        if (!stop.name) {
                            return fm(`Stop name invalid: ${s(dir)}`);
                        }
                    }
                }

                for (let k = 0; k < dir.path.length; k++) {
                    const path = dir.path[k];

                    if (!isCoordsValid(path)) {
                        return fm(`Path coordinates invalid: ${s(dir)}`);
                    }
                }
            }
        }

        if (busDirs === 0) {
            console.warn(`WARNING: No bus route/directions found for route ${routeParams.name}`);
            // console.log((res.body.data.map(route => ({
            //     type: route.directions.type,
            //     name: route.directions.name,
            //     route: route.directions.routeNumber,
            // }))));
            // console.log((res.body.data.map(route => route.directions)));
            routeParams.warning = true;
        } else {
            // console.log((res.body.data.map(route => route.directions)));
        }

        if (walkingDirs === 0) {
            console.warn(`WARNING: No walking route/directions found for route ${routeParams.name}`);
            // console.log(res.body.data.map(route => route.directions));
            routeParams.warning = true;
        }

        return {
            pass: true,
            message: 'Route should not be valid',
        };
    },
};

expect.extend(expectTests);

export default {
    expectTests,
    getReleaseRes,
    printReleaseDiff,
    logToFile,
    removeKeys,
};
