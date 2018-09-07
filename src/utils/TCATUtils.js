// @flow
import fs from 'fs';
import csv from 'csvtojson';
import dotenv from 'dotenv';

dotenv.config();
const routeJson = [];

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
};
