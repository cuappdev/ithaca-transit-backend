// @flow
// General utility functions / Objects helpful in a JS setting across
// all AppDev projects

/**
 * Check if a string is an AppDev-formatted URL. An AppDev formatted URL is
 * either just a '/', or begins and ends with a `/`, and must have some
 * characters in between.
 */
const tryCheckAppDevURL = (path: string) => {
    if (path !== '/' && path.length < 2) {
        throw new Error('Invalid path!');
    } else if (path[0] !== '/') {
        throw new Error('Path must start with a \'/\'!');
    } else if (path[path.length - 1] !== '/') {
        throw new Error('Path must end with a \'/\'!');
    }
};

const insertIntoMySQLStatement = (
    tableName: string,
    fields: Object,
): string => {
    const columns = `(${Object.keys(fields).join(', ')})`;
    const valuesStr = Object.keys(fields).map((k) => {
        const value = fields[k];
        return typeof value === 'string'
            ? `'${fields[k]}'`
            : `${fields[k]}`;
    }).join(', ');
    const values = `(${valuesStr})`;
    return `INSERT INTO ${tableName} ${columns} VALUES ${values};`;
};

export default {
    tryCheckAppDevURL,
    insertIntoMySQLStatement,
};
