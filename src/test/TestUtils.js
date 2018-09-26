/* eslint-disable no-console */
const moment = require('moment');

// stringify and/or format a value
function s(v) {
    if (typeof v === 'string') return v;
    if (v) return JSON.stringify(v, null, '\t');
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

function checkRouteValid(res) {
    if (!res) {
        throw new Error('No response');
    }
    if (!res.statusCode || res.statusCode >= 300) {
        throw new Error(`Bad route status code: ${s(res.statusCode)}`);
    }
    if (!res.body) {
        throw new Error(`No route response body: ${s(res)}`);
    }
    if (res.body.success === false) {
        throw new Error(`Route request success:false; ${s(res.body)}`);
    }
    if (!res.body.data || res.body.data.length === 0) {
        throw new Error(`Route request data empty: ${s(res.body)}`);
    }

    for (let i = 0; i < res.body.data.length; i++) {
        const route = res.body.data[i];

        if (!route) {
            throw new Error(`Route body has empty routes: ${s(route.body)}`);
        }
        if (!(route.departureTime && route.arrivalTime)) {
            throw new Error(`Route departureTime or arrivalTime empty: ${route.body}`);
        }
        if (!isCoordsValid(route.endCoords)) {
            throw new Error(`Route endCoords invalid: ${s(route)}`);
        }
        if (!isCoordsValid(route.startCoords)) {
            throw new Error(`Route startCoords invalid: ${s(route)}`);
        }
        if (!route.boundingBox
            || !(route.boundingBox.minLat
                && route.boundingBox.minLong
                && route.boundingBox.maxLat
                && route.boundingBox.maxLong)) {
            throw new Error(`Route boundingBox invalid: ${s(route)}`);
        }
        if ((route.numberOfTransfers && !isNum(route.numberOfTransfers)) || route.numberOfTransfers < 0) {
            throw new Error(`Route numberOfTransfers invalid: ${s(route)}`);
        }

        for (let j = 0; j < route.directions.length; j++) {
            const dir = route.directions[j];

            if (!dir) {
                throw new Error(`Directions empty: ${s(route)}`);
            }
            if (!dir.path || !(dir.path.length > 0)) {
                throw new Error(`Directions path empty: ${s(dir)}`);
            }
            if (!isCoordsValid(dir.endLocation)) {
                throw new Error(`Directions endLocation invalid: ${s(dir)}`);
            }
            if (!isCoordsValid(dir.startLocation)) {
                throw new Error(`Directions startLocation invalid: ${s(dir)}`);
            }
            if (!isDateValid(dir.startTime)) {
                throw new Error(`Directions startTime invalid: ${s(dir)}`);
            }
            if (!isDateValid(dir.endTime)) {
                throw new Error(`Directions endTime invalid: ${s(dir)}`);
            }
            if (!dir.name) {
                throw new Error(`Directions name invalid: ${s(dir)}`);
            }
            if (!dir.distance || !isNum(dir.distance)) {
                throw new Error(`Directions distance invalid: ${s(dir)}`);
            }
            if (!dir.type || !(dir.type === 'walk' || dir.type === 'depart')) {
                throw new Error(`Directions type invalid: ${s(dir)}`);
            }

            if (dir.type === 'walk') {
                if ((dir.stops && dir.stops.length > 0)
                    || dir.stayOnBusForTransfer
                    || dir.routeNumber
                    || dir.delay
                    || dir.tripIdentifiers
                ) {
                    throw new Error(`Directions walk data invalid: ${s(dir)}`);
                }
            } else { // type === 'depart'
                if (!dir.routeNumber || dir.routeNumber === 0) {
                    throw new Error(`Directions routeNumber invalid: ${s(dir)}`);
                }
                if (!dir.stops || dir.stops.length === 0) {
                    throw new Error(`Directions stops invalid: ${s(dir)}`);
                }
                if (!dir.tripIdentifiers) {
                    throw new Error(`Directions tripIdentifiers invalid: ${s(dir)}`);
                }

                for (let k = 0; k < dir.stops.length; k++) {
                    const stop = dir.stops[k];

                    if (!isCoordsValid(stop)) {
                        throw new Error(`Stops coordinates invalid: ${s(dir)}`);
                    }
                    if (!stop.stopID || !isNum(stop.stopID)) {
                        throw new Error(`Stops stopID invalid: ${s(dir)}`);
                    }
                    if (!stop.name) {
                        throw new Error(`Stop name invalid: ${s(dir)}`);
                    }
                }
            }

            for (let k = 0; k < dir.path.length; k++) {
                const path = dir.path[k];

                if (!isCoordsValid(path)) {
                    throw new Error(`Path coordinates invalid: ${s(dir)}`);
                }
            }
        }
    }

    return true;
}

module.exports = {
    s,
    checkRouteValid,
    isNum,
    isDateValid,
    isCoordsValid,
};
