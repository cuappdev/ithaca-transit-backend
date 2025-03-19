const ALERTS_URL =
  "https://realtimetcatbus.availtec.com/InfoPoint/rest/PublicMessages/GetAllMessages";

let alertsData = null;

function formatDate(dateStr) {
  // Example: dateStr is "/Date(1547528400000-0500)/"
  const timestamp = parseInt(dateStr.substring(6, dateStr.indexOf("-")), 10);
  const utcDate = new Date(timestamp).toISOString();
  return utcDate;
}

function convertNumToStr(tcatNum) {
  const numDayDict = {
    127: "Every day",
    65: "Weekends",
    62: "Weekdays",
    2: "Monday",
    4: "Tuesday",
    8: "Wednesday",
    16: "Thursday",
    32: "Friday",
    64: "Saturday",
    1: "Sunday",
  };
  return numDayDict[tcatNum] || "";
}

async function fetchAlerts() {
  try {
    const response = await fetch(ALERTS_URL);
    if (!response.ok) {
      throw new Error(`Unable to get alerts`);
    }
    const alertList = await response.json();

    alertsData = alertList.map((alertDict) => ({
      channelMessages: alertDict.ChannelMessages,
      daysOfWeek: convertNumToStr(alertDict.DaysOfWeek),
      fromDate: formatDate(alertDict.FromDate),
      fromTime: formatDate(alertDict.FromTime),
      id: alertDict.MessageId,
      message: alertDict.Message,
      priority: alertDict.Priority,
      routes: alertDict.Routes,
      signs: alertDict.Signs,
      toDate: formatDate(alertDict.ToDate),
      toTime: formatDate(alertDict.ToTime),
    }));
  } catch (error) {
    console.error(error);
  }
}

function getAlertsData() {
  return alertsData;
}

export default {
  getAlertsData,
  fetchAlerts,
};
