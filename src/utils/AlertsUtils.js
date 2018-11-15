// @flow
import interval from 'interval-promise';
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';
import ErrorUtils from './LogUtils';

let alerts = RequestUtils.fetchRetry(fetchAlerts);
const ONE_MINUTE_MS = 1000 * 60;

async function fetchAlerts() {
    try {
        const authHeader = await TokenUtils.fetchAuthHeader();

        const options = {
            method: 'GET',
            url: 'https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/PublicMessages/GetAllMessages',
            headers:
                {
                    'Cache-Control': 'no-cache',
                    Authorization: authHeader,
                },
        };

        const alertsRequest = await RequestUtils.createRequest(options, 'alerts request failed');

        if (alertsRequest) {
            return JSON.parse(alertsRequest).map(alert => ({
                id: alert.MessageId,
                message: alert.Message,
                fromDate: parseMicrosoftFormatJSONDate(alert.FromDate),
                toDate: parseMicrosoftFormatJSONDate(alert.ToDate),
                fromTime: parseMicrosoftFormatJSONDate(alert.FromTime),
                toTime: parseMicrosoftFormatJSONDate(alert.ToTime),
                priority: alert.Priority,
                daysOfWeek: getWeekdayString(alert.DaysOfWeek),
                routes: alert.Routes,
                signs: alert.Signs,
                channelMessages: alert.ChannelMessages,
            }));
        }
    } catch (err) {
        ErrorUtils.logErr(err, null, 'fetchAlerts error');
        throw err;
    }

    return null;
}

function parseMicrosoftFormatJSONDate(dateStr) {
    return new Date(parseInt(dateStr.substr(6)));
}

function getWeekdayString(daysOfWeek) {
    switch (daysOfWeek) {
        case 127:
            return 'Every day';
        case 65:
            return 'Weekends';
        case 62:
            return 'Weekdays';
        case 2:
            return 'Monday';
        case 4:
            return 'Tuesday';
        case 8:
            return 'Wednesday';
        case 16:
            return 'Thursday';
        case 32:
            return 'Friday';
        case 64:
            return 'Saturday';
        case 1:
            return 'Sunday';
        default:
            return '';
    }
}

function start() {
    interval(async () => {
        // fetch and set alerts
        await alerts; // if initializing, don't try again
        alerts = await RequestUtils.fetchRetry(fetchAlerts);
    }, ONE_MINUTE_MS, { stopOnError: false });
}

export default {
    start,
    alerts,
};
