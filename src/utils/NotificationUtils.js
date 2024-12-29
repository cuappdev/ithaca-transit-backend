// eslint-disable-next-line no-unused-vars
import * as admin from 'firebase-admin';
// eslint-disable-next-line import/no-unresolved
import { getMessaging } from 'firebase-admin/messaging';
import  schedule from 'node-schedule';

const departures = {};
// add a dictionary that keeps tracks of the events that are scheduled and
// delete them when a delete request comes in

function sendNotification(deviceToken, notifData) {
  const message = {
    data: notifData,
    token: deviceToken,
  };
  if (deviceToken !== '') {
    getMessaging().send(message)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log('Missing device token');
        console.log(error);
      });
  } else {
    console.log('Missing device token');
  }
}

function waitForDeparture(deviceToken, startTime) {
  const startDate = new Date((parseInt(startTime) * 1000) - (60000 * 10));

  const notifData = {
    data: 'You should board your bus in 10 minutes',
    notification: 'Bording Reminder',
  };

  const job = schedule.scheduleJob(startDate,
    () => {
      sendNotification(deviceToken, notifData);
    });
  if (deviceToken in departures) {
    departures[deviceToken][startDate] = job;
  } else {
    departures[deviceToken] = {};
    departures[deviceToken][startDate] = job;
  }
}

function cancelDeparture(deviceToken, startTime) {
  const startDate = new Date((parseInt(startTime) * 1000) - (60000 * 10));

  if (deviceToken in departures) {
    if (startDate in departures[deviceToken]) {
      if (departures[deviceToken][startDate]) {
        departures[deviceToken][startDate].cancel();
        console.log('Job canceled.');
      }

      // delete departures[deviceToken][startDate]
    }
  }
}

export default {
  sendNotification,
  waitForDeparture,
  cancelDeparture,
};
