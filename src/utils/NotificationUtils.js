import * as admin from 'firebase-admin';
import { getMessaging } from "firebase-admin/messaging";
import LogUtils from './LogUtils';

function notifyForDelays(deviceToken: string, stopID: String, tripID: String, uid: string) {
  // TODO: Implement

  const notifData = {
    data: 'test',
    notification: 'testBody',
  };
  const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24,
  };
  const message = {
    data: notifData,
    token: deviceToken,
  };
  if (deviceToken !== '') {
    getMessaging().send(message)
      .then((response) => {
        LogUtils.log({ message: response });
        console.log('hi');
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

export default {
  notifyForDelays,
};
