import { getMessaging } from "firebase-admin/messaging";
import schedule from "node-schedule";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const notifPath = path.join(__dirname, "..", "data", "notifRequests.json");

let notifRequests;
let rtfData;

try {
  const data = fs.readFileSync(notifPath, "utf8");
  notifRequests = JSON.parse(data);
} catch (err) {
  console.error(err);
  notifRequests = {};
}

const saveNotifs = () => {
  fs.writeFileSync(notifPath, JSON.stringify(notifRequests, null, 2));
};

let departures = {};
// add a dictionary that keeps tracks of the events that are scheduled and
// delete them when a delete request comes in

function addDelayNotification(tripID, stopID, deviceToken) {
  if (!(tripID in notifRequests)) {
    notifRequests[tripID] = { [stopID]: [deviceToken] };
  } else {
    const tokens = notifRequests[tripID][stopID] || [];
    if (!tokens.includes(deviceToken)) {
      tokens.push(deviceToken);
    }
    notifRequests[tripID][stopID] = tokens;
  }
  saveNotifs();
}

function deleteDelayNotification(tripID, stopID, deviceToken) {
  if (tripID in notifRequests) {
    if (stopID in notifRequests[tripID]) {
      notifRequests[tripID][stopID] = notifRequests[tripID][stopID].filter(
        (token) => token !== deviceToken
      );
      if (notifRequests[tripID][stopID].length === 0) {
        delete notifRequests[tripID][stopID];
      }
      if (Object.keys(notifRequests[tripID]).length === 0) {
        delete notifRequests[tripID];
      }
    }
  }
  saveNotifs();
}

function sendNotifications() {
  for (const id in rtfData) {
    if (id in notifRequests) {
      for (const stopID in notifRequests[id]) {
        if (stopID in rtfData[id]["stopUpdates"]) {
          for (const deviceToken of notifRequests[id][stopID]) {
            sendNotification(
              deviceToken,
              `The bus on ${rtfData[id]["routeId"]} is delayed`,
              "testBody"
            );
          }
        }
      }
    }
  }
  saveNotifs();
}

function sendNotification(deviceToken, data, notification) {
  const message = {
    data: {
      data,
      notification,
    },
    token: deviceToken,
  };
  if (!message.token) {
    throw new Error("Invalid device token");
  }
  getMessaging()
    .send(message)
    .then((response) => {
      console.log(response);
    });
}

function waitForDeparture(deviceToken, startTime) {
  const startDate = new Date(parseInt(startTime) * 1000 - 60000 * 10);

  const notifData = {
    data: "You should board your bus in 10 minutes",
    notification: "Bording Reminder",
  };

  const job = schedule.scheduleJob(startDate, () => {
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
  const startDate = new Date(parseInt(startTime) * 1000 - 60000 * 10);

  if (deviceToken in departures) {
    if (startDate in departures[deviceToken]) {
      if (departures[deviceToken][startDate]) {
        departures[deviceToken][startDate].cancel();
        console.log("Job canceled.");
      }
    }
  }
}

export default {
  addDelayNotification,
  deleteDelayNotification,
  sendNotifications,
  sendNotification,
  waitForDeparture,
  cancelDeparture,
};
