import LogUtils from './LogUtils.js';
import RealtimeFeedUtilsV3 from './RealtimeFeedUtilsV3.js';
import ParseRouteUtilsV3 from './ParseRouteUtilsV3.js';
import sqlite3 from "sqlite3";
import { fileURLToPath } from 'url';
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'transit.db');

/**
 * Returns the closest bus on a given routeId and start position.
 * 
 * @param routeId
 * @param start
 * @returns {Object}
 */
async function getClosestBus(routeId, start) {
  LogUtils.log({ message: 'getClosestBus: entering function', routeId });
  const vehicles = await RealtimeFeedUtilsV3.fetchVehicles();

  if (!vehicles) {
    LogUtils.log({ message: 'No vehicle data available' });
    return null;
  }
  
  const routeVehicles = Object.values(vehicles).filter(
    v => v.routeID === routeId );
  
  if (routeVehicles.length === 0) {
    LogUtils.log({ message: 'No vehicles found for given route', routeId });
    return null;
  }

  const startPointList = start.split(',');
  const startPoint = { lat: startPointList[0], long: startPointList[1] };
  
  let closestVehicle = null;
  let minDistance = Infinity;
  
  for (const vehicle of routeVehicles) {
    const vehiclePosition = {
      lat: vehicle.latitude,
      long: vehicle.longitude,
    };
      
    const distance = ParseRouteUtilsV3.distanceBetweenPointsMiles(
      vehiclePosition,
      startPoint,
    );
      
    if (distance < minDistance) {
      minDistance = distance;
      closestVehicle = vehicle;
    }
  }
  
  if (!closestVehicle) {
    LogUtils.log({ message: 'No closest vehicle found', routeId });
    return null;
  }
  
  return closestVehicle;
}



/**
 * Fetches a report from the database by its id.
 *
 * @param reportId
 * @returns {Promise<Object>}
 */
function fetchReportById(reportId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
    });

    db.get('SELECT * FROM reports WHERE id = ?', [reportId], (err, row) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      db.close((err) => {
        if (err) console.error(err.message);
        console.log('Closed the database connection.');
      });
      resolve(row);
    });
  });
}


/**
 * Inserts a report into the database. If a timestamp is not provided, the current time will be used.
 * 
 * @param vehicleId
 * @param routeId
 * @param reportText
 * @param deviceToken
 * @param timestamp Optional
 * @returns {Promise<Object>}
 */
function insertReport(vehicleId, congestionLevel, deviceToken, timestamp = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
    });

    let query, values;

    if (timestamp) {
      query = `
        INSERT INTO reports (timestamp, vehicleID, congestionLevel, deviceToken)
        VALUES (?, ?, ?, ?, ?)
      `;
      values = [timestamp, vehicleId, routeId, reportText, deviceToken];
    } else {
      query = `
        INSERT INTO reports (vehicleId, routeId, report_text, deviceToken)
        VALUES (?, ?, ?, ?)
      `;
      values = [timestamp, vehicleId, congestionLevel, deviceToken];
    }

    db.run(query, values, async function (err) {
      if (err) {
        console.error('Error inserting report:', err.message);
        return reject(err);
      }

      const insertedId = this.lastID;
      db.close((err) => {
        if (err) console.error('Error closing database after insert:', err.message);
        console.log('Closed the database connection after insert.');
      });

      try {
        const report = await fetchReportById(insertedId);
        resolve(report);
      } catch (fetchErr) {
        reject(fetchErr);
      }
    });
  });
}



/**
 * Fetches all reports from the database by vehicle ID.
 *
 * @param vehicleId
 * @returns {Promise<Array<Object>>}
 */
function fetchReportsByBus(vehicleId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
    });

    db.all('SELECT * FROM reports WHERE vehicleID = ?', [vehicleId], (err, rows) => {
      if (err) {
        console.error(err.message);
        return reject(err);
      }

      db.close((err) => {
        if (err) console.error(err.message);
        console.log('Closed the database connection.');
      });

      resolve(rows);
    })
  })
}
  
export default {
  getClosestBus,
  insertReport,
  fetchReportsByBus
};
  
