// @flow
import fs, { write } from 'fs';
import { RegisterSession } from 'appdev';
import csv from 'csvtojson';
import createGpx from 'gps-to-gpx';
import dotenv from 'dotenv';

dotenv.config();
const routeJson = [];

const secret_key = process.env.REGISTER_TOKEN || '';
const register = new RegisterSession('http://register.cornellappdev.com', secret_key, 5);

function writeToRegister(event_type: string, payload: Object) {
    register.logEvent(event_type, payload);
}

function readCSV(fileName: string) {
    return new Promise(((resolve, reject) => {
        fs.readFile(`tcat-ny-us/${fileName}`, 'utf8', (err, csvString) => {
            if (err) {
                reject(err);
            } else {
                resolve(csvString);
            }
        });
    }));
}

function createRouteJson(fileName: string) {
    readCSV(fileName)
        .then((csvString) => {
            csv()
                .fromString(csvString)
                .on('json', (jsonObj) => {
                    routeJson.push(jsonObj);
                })
                .on('done', (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
        });
}

export default {
    routeJson,
    createRouteJson,
    writeToRegister,
};
