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

  LogUtils.log(jsonFilePath);

  if (fs.existsSync(jsonFilePath)) {
    // File exists
    LogUtils.log('File exists!');
  } else {
    // File does not exist
    LogUtils.log('File does not exist.');
  }

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

export default { storeReportJson };
