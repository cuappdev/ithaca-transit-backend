//@flow
import ErrorCodes from './ErrorCodes';
import TCATUtils from './TCATUtils';

function getErrorCode(message) {

    message = message.toLowerCase();

    if (message.includes('is out of bounds')) {
        return ErrorCodes.OUT_OF_BOUNDS; //Point 0 is out of bounds: 42.4929015990742,-76.9723900315137
    } else if (message.includes('maximum number of nodes exceeded')) {
        return ErrorCodes.MAX_NODES_EXCEEDED; //No path found - maximum number of nodes exceeded: 1000000
    } else if (message.includes('no route found')) {
        return ErrorCodes.NO_ROUTE_FOUND;
    } else {
            return ErrorCodes.UNKNOWN;
    }
}

function generateErrorResponse(message) {
    return {
        errors: getErrorCode(message),
        message: message
    };
}

function logToRegister(message, parameters, note, logConsole) {
    let response = generateErrorResponse(message);
    if(note) {
        TCATUtils.writeToRegister(response.errors,
            {
                "parameters": JSON.stringify(parameters),
                "message": message,
                "note": note
            });
    } else {
        TCATUtils.writeToRegister(response.errors,
            {
                "parameters": JSON.stringify(parameters),
                "message": message
            });
    }

    if(logConsole) {
        console.log(JSON.stringify(response) + ' "note:"' + note);
    }

    return response;
}

function getErrorKey(val) {
    return Object.keys(ErrorCodes).find(key => ErrorCodes[key] === val);
}

export default {
    getErrorCode: getErrorCode,
    generateErrorResponse: generateErrorResponse,
    logToRegister: logToRegister,
    getErrorKey: getErrorKey
}