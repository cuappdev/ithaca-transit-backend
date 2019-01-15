// @flow
import util from 'util';

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
    data: ?Object = {},
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

        log(responseJSON, true);
        return responseJSON;
    } catch (e) {
        return error;
    }
}

export default {
    log,
    logErr,
};
