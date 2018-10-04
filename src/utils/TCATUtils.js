// @flow
import csv from 'csvtojson';
import dotenv from 'dotenv';
import request from 'request';
import fs from 'fs';
import DecompressZip from 'decompress-zip';
import ErrorUtils from './ErrorUtils';

dotenv.config();

const zipFile = 'tcat-ny-us.zip';
const zipUrl = 'https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip';
const extractDir = 'tcat-ny-us';

const routeJson = getRouteJson(false);
let routeData = [];
const routeFilename = 'routes.txt';

/**
 * Get remote TCAT data, unzip, then save unless TCAT data already exists.
 * Return the directory name.
 *
 * @param useCache
 * @returns {Promise<any>}
 */
async function getTCATData(useCache: boolean = true) {
    return new Promise((resolve, reject) => {
        if (useCache && fs.existsSync(`${extractDir}/${routeFilename}`)) {
            resolve(extractDir);
        }

        const unzipper = new DecompressZip(zipFile)
            .on('error', (err) => { throw err; })
            .on('extract', (log) => { resolve(extractDir); });

        if (useCache && fs.existsSync(zipFile)) {
            unzipper.extract({ path: extractDir });
        } else {
            request
                .get(zipUrl)
                .pipe(fs.createWriteStream(zipFile))
                .on('error', (err) => {
                    throw err;
                })
                .on('finish', () => {
                    unzipper.extract({ path: extractDir });
                });
        }
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, zipFile, `Could not get ${zipFile} from ${zipUrl}`);
        return [];
    });
}

/**
 * Get route data
 * @param useCache
 * @returns {Promise<*>}
 */
async function getRouteJson(useCache: boolean = true) {
    const path = await getTCATData(useCache) && extractDir;

    if (useCache && routeData && routeData.length > 0 && path) {
        return routeData;
    }

    return new Promise((resolve, reject) => {
        csv().fromFile(`${path}/${routeFilename}`).then((jsonObj) => {
            routeData = jsonObj;
            resolve(routeData);
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, routeFilename, 'Could not get route json');
        return [];
    });
}

export default {
    routeJson,
};
