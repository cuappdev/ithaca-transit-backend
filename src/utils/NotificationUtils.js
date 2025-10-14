import { getMessaging } from "firebase-admin/messaging";
import schedule from "node-schedule";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import RealtimeFeedUtilsV3 from "./RealtimeFeedUtilsV3.js";
import LogUtils from "./LogUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const notifPath = path.join(__dirname, "..", "data", "notifRequests.json");

let notifRequests;

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
  const rtfData = RealtimeFeedUtilsV3.getRTFData();

  if (!rtfData) {
    return;
  }

  const tokensToDelete = [];

  for (const id in rtfData) {
    if (id in notifRequests) {
      for (const stopID in notifRequests[id]) {
        if (stopID in rtfData[id]["stopUpdates"]) {
          //only send a notification if there is a delay
          if (rtfData[id]["stopUpdates"][stopID] > 0) {
            for (const deviceToken of notifRequests[id][stopID]) {
              const notifData = {
                title: "Delay Notification",
                body: `The bus on ${rtfData[id]["routeId"]} is delayed`,
              };

              sendNotification(deviceToken, notifData);

              tokensToDelete.push({ id, stopID, deviceToken });
            }
          }
        }
      }
    }
  }

  for (const { id, stopID, deviceToken } of tokensToDelete) {
    if (
      notifRequests[id] &&
      notifRequests[id][stopID] &&
      Array.isArray(notifRequests[id][stopID])
    ) {
      notifRequests[id][stopID] = notifRequests[id][stopID].filter(
        (token) => token !== deviceToken
      );
      if (notifRequests[id][stopID].length === 0) {
        delete notifRequests[id][stopID];
      }
    }
  }

  saveNotifs();
}

async function sendNotification(deviceToken, notif) {
  const message = {
    token: deviceToken,
    notification: {
      title: notif.title,
      body: notif.body,
    },
  };

  if (!message.token) {
    throw new Error("Invalid device token");
  }

  try {
    const response = await getMessaging()
      .send(message)
      .then((response) => {
        LogUtils.log({ message: response });
        console.log(response);
      });

    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error.code, error.message);
  }
}

function waitForDeparture(deviceToken, startTime) {
  const startDate = new Date(parseInt(startTime) * 1000 - 60000 * 10);

  const notifData = {
    body: "You should board your bus in 10 minutes",
    title: "Bording Reminder",
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
  let startDate = new Date(parseInt(startTime) * 1000 - 60000 * 10);
  startDate = startDate.toString();

  if (deviceToken in departures) {
    if (startDate in departures[deviceToken]) {
      if (departures[deviceToken][startDate]) {
        departures[deviceToken][startDate].cancel();
        LogUtils.log({ message: "job canceled" });
      }
    }
  }
}

export default {
  addDelayNotification,
  deleteDelayNotification,
  sendNotifications,
  waitForDeparture,
  cancelDeparture,
};
