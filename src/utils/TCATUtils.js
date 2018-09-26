// @flow
import csv from 'csvtojson';
import dotenv from 'dotenv';
import ErrorUtils from './ErrorUtils';

dotenv.config();
let routeJson = [];
const routeFilename = 'routes.txt';

async function getRouteJson(fileName: string = routeFilename, refreshFromFile: boolean = false) {
    return new Promise((resolve, reject) => {
        if (!refreshFromFile && routeJson && routeJson.length > 0 && routeFilename === fileName) {
            resolve(routeJson);
        }

        csv().fromFile(`tcat-ny-us/${fileName}`).then((jsonObj) => {
            routeJson = jsonObj;
            resolve(routeJson);
        });
    }).then(value => value).catch((error) => {
        ErrorUtils.log(error, fileName, 'Could not get route json');
        return [];
    });
}

export default {
    getRouteJson,
};
