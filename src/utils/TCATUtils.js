/* eslint-disable no-console */
// @flow
import csv from 'csvtojson';
import dotenv from 'dotenv';
import request from 'request';
import fs from 'fs';
import DecompressZip from 'decompress-zip';
import moment from 'moment';
import ErrorUtils from './LogUtils';

dotenv.config();

const root = '.';
const zipFile = 'tcat-ny-us.zip';
const zipUrl = 'https://s3.amazonaws.com/tcat-gtfs/tcat-ny-us.zip';
const extractDir = 'tcat-ny-us';

const dataInfo = [ // [ (data obj name in GTFSdata), (filename of data to be parsed into JSON) ]
    ['calendar', 'calendar_dates.txt'],
    ['routes', 'routes.txt'],
];

const TCATData = getTCATData();
const GTFSData = getGTFSData(dataInfo);
const validGTFSBufferDays = 7 * 4; // error this many days before GTFS data expires
checkGTFSDatesValid();

/**
 * Get remote TCAT data, unzip, then save unless TCAT data already exists.
 * Return the directory name.
 *
 * @param useCache
 * @returns {Promise<any>}
 */
function getTCATData(useCache: boolean = true) {
    // eslint-disable-next-line consistent-return
    return new Promise(async (resolve, reject) => {
        if (useCache && fs.existsSync(`${root}/${extractDir}`)) {
            resolve(`${root}/${extractDir}`);
            return `${root}/${extractDir}`;
        }

        const unzipper = new DecompressZip(zipFile)
            .on('error', (err) => { throw err; })
            .on('extract', (log) => {
                console.log(`Finshed extracting TCAT GTFS data to ${root}/${extractDir}`);
                resolve(`${root}/${extractDir}`);
                return `${root}/${extractDir}`;
            });

        if (useCache && fs.existsSync(`${root}/${zipFile}`)) {
            console.log('Extracting TCAT GTFS data...');
            await unzipper.extract({ path: `${root}/${extractDir}` });
        } else {
            console.log('Downloading TCAT GTFS data...');
            request
                .get(zipUrl)
                .pipe(fs.createWriteStream(`${root}/${zipFile}`))
                .on('error', (err) => {
                    throw err;
                })
                .on('finish', async () => {
                    console.log('Extracting TCAT GTFS data...');
                    await unzipper.extract({ path: `${root}/${extractDir}` });
                });
        }
    }).then(value => value).catch((error) => {
        ErrorUtils.logErr(error, zipFile, `Could not get ${root}/${zipFile} from ${zipUrl}`);
        return [];
    });
}

/**
 * Generate JSON objects for the specified
 * @param fileName
 * @param dataName
 * @param useCache
 * @returns {Promise<*>}
 */
async function getGTFSJson(dataName, fileName, useCache: boolean = true) {
    const path = (await TCATData) && extractDir;

    if (useCache && GTFSData[dataName] && GTFSData[dataName].length > 0 && path) {
        return GTFSData[dataName];
    }

    return new Promise((resolve, reject) => {
        TCATData.then((result) => {
            csv().fromFile(`${path}/${fileName}`).then((jsonObj) => {
                resolve(jsonObj);
                return jsonObj;
            });
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.logErr(error, fileName, `Could not get json from ${path}/${fileName}`);
        return [];
    });
}

async function getGTFSData() {
    await TCATData;

    const GTFSobj = {};

    await Promise.all(dataInfo.map(async ([dataName, fileName]) => {
        GTFSobj[dataName] = await getGTFSJson(dataName, fileName);
        return dataName;
    }));

    return GTFSobj;
}

/**
 * Get route data
 * @param useCache
 * @returns {Promise<*>}
 */
async function checkGTFSDatesValid(useCache: boolean = true) {
    const cal = (await GTFSData).calendar;
    if (cal && cal.length > 0) {
        const now = moment();
        const startDate = moment(cal[0]);
        const endDate = moment(cal[cal.length - 1]);
        const warningDate = endDate.subtract(validGTFSBufferDays, 'days');

        if (now.isBefore(startDate)) {
            throw ErrorUtils.logErr('FATAL ERROR: GTFS DATA IS INVALID, NOW IS BEFORE THE START DATE', endDate, 'ARCHIVE AND REFRESH GTFS DATA IMMEDIATELY', false);
        }
        if (now.isAfter(endDate)) {
            throw ErrorUtils.logErr('FATAL ERROR: GTFS DATA IS EXPIRED', endDate, 'ARCHIVE AND REFRESH GTFS DATA IMMEDIATELY', false);
        }
        if (now.isAfter(warningDate)) {
            const remaining = endDate.subtract(now);
            ErrorUtils.logErr(`WARNING: GTFS DATA WILL EXPIRE IN ${remaining} DAYS`, endDate, 'ARCHIVE AND REFRESH GTFS DATA SOON', false);
        }
        return true;
    }

    throw ErrorUtils.logErr('Could not get and validate GTFS calendar data', cal || null, 'checkGTFSDatesValid failed');
}

export default {
    routesJson: GTFSData.then(result => result.routes),
};
