//@flow
import axios from 'axios';
import TokenUtils from './TokenUtils';
import alarm from 'alarm';

let alerts = [];
const MINUTE_IN_MS = 1000 * 60;
let allStopsAlarm;

async function fetchAlerts() {
    try {
        let authHeader = await TokenUtils.getAuthorizationHeader();
        let alertsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/PublicMessages/GetAllMessages',
            {headers: {Authorization: authHeader}});
        alerts = alertsRequest.data.map(alert => {
            return {
                id: alert.MessageId,
                message: alert.Message,
                fromDate: alert.FromDate,
                toDate: alert.ToDate,
                fromTime: alert.FromTime,
                toTime: alert.ToTime,
                priority: alert.Priority,
                daysOfWeek: alert.DaysOfWeek,
                routes: alert.Routes,
                signs: alert.Signs,
                channelMessages: alert.ChannelMessages
            }
        });
    } catch (err) {
        console.log('got error from fetchAlerts');
        throw err;
    }
}

function getAlerts() {
    if (alerts.length == 0) {
        fetchAlerts();
    }
    return alerts
}

function start() {
    allStopsAlarm = alarm.recurring(MINUTE_IN_MS, fetchAlerts);
    fetchAlerts();
}

export default {
    start: start,
    getAlerts: getAlerts
};