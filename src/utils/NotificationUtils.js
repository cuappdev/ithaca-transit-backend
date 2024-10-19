// eslint-disable-next-line no-unused-vars
import * as admin from 'firebase-admin';
// eslint-disable-next-line import/no-unresolved
import { getMessaging } from 'firebase-admin/messaging';

const schedule = require('node-schedule');

function sendNotification(deviceToken: string, notifData) {
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

function waitForDeparture(deviceToken: string, startTime: string) {
  const startDate = new Date((parseInt(startTime) * 1000) - (60000 * 10));

  const notifData = {
    data: 'You should board your bus in 10 minutes',
    notification: 'Bording Reminder',
  };
  schedule.scheduleJob(startDate,
    () => {
      sendNotification(deviceToken, notifData);
    });
}

export default {
  sendNotification,
  waitForDeparture,
};
