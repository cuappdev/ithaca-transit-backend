// @flow
import LogUtils from './LogUtils';

const fs = require('fs');

/**
 * Stores new fullness report in JSON file.
 *
 * @param tripId
 * @param time
 * @param fullness
 * @returns {Object}
 */
async function storeReportJson(
  tripId,
  time,
  fullness,
):
  Object {
  const newReport = { tripId, time, fullness };

  const jsonFilePath = './busFullness.json';

  try {
    // Read existing reports from JSON file
    const fileContent = await fs.promises.readFile(jsonFilePath, 'utf-8');

    // Parse data into JSON
    const jsonData = JSON.parse(fileContent);

    // Add the new report to the reports array
    jsonData.reports.push(newReport);

    // Write the updated data back to the JSON file
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

    // Return success response
    return {
      report: newReport,
    };
  } catch (err) {
    LogUtils.log({ message: err });
    return {
      message: 'Failed to save report',
    };
  }
}

/**
 * Returns fullness of requested trip and minutes since last fullness was reported
 *
 * @param tripId
 * @returns {Object}
 */
async function getBusFullness(
  tripId,
):
  Object {
  const jsonFilePath = './busFullness.json';

  try {
    // Read existing reports from JSON file
    const fileContent = await fs.promises.readFile(jsonFilePath, 'utf-8');

    // Parse data into JSON
    const jsonData = JSON.parse(fileContent);

    let tripFullness = 0;
    let minSinceLastReport = 0;

    // Filter reports for the specified tripId
    const reportsForTrip = jsonData.reports.filter(report => report.tripId === tripId);

    // Check if there are any reports for that tripId
    if (reportsForTrip.length === 0) {
      return null;
    }

    // Find the report with the maximum time value
    const recentTime = (latest, current) => (current.time > latest.time ? current : latest);
    const mostRecentReport = reportsForTrip.reduce(recentTime);

    // Get trip fullness
    tripFullness = mostRecentReport.fullness;
    // Get minutes since last report for trip
    minSinceLastReport = Math.floor((Math.floor(Date.now() / 1000) - mostRecentReport.time) / 60);

    // Return success response
    return {
      fullness: tripFullness,
      timeSinceLastReport: minSinceLastReport,
    };
  } catch (err) {
    LogUtils.log({ message: err });
    return {
      message: err,
    };
  }
}

export default {
  storeReportJson,
  getBusFullness,
};
