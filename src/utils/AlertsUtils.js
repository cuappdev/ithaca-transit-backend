// @flow
import RequestUtils from './RequestUtils';
import TokenUtils from './TokenUtils';
import ErrorUtils from './LogUtils';

const alerts = RequestUtils.fetchWithRetry(fetchAlerts);
const ONE_SEC_MS = 1000;
const ONE_MINUTE_MS = ONE_SEC_MS * 60;

const updateAlertsFunction = async () => {
    await RequestUtils.fetchWithRetry(fetchAlerts);
    return true;
};

RequestUtils.updateObjectOnInterval(
    updateAlertsFunction,
    ONE_MINUTE_MS,
    ONE_MINUTE_MS,
    alerts,
);

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
                fromDate: convertUnixDateStrToJSDate(alert.FromDate),
                toDate: convertUnixDateStrToJSDate(alert.ToDate),
                fromTime: convertUnixDateStrToJSDate(alert.FromTime),
                toTime: convertUnixDateStrToJSDate(alert.ToTime),
                priority: alert.Priority,
                daysOfWeek: convertTCATNumToStr(alert.DaysOfWeek),
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

function convertUnixDateStrToJSDate(dateStr: string): Date {
    return new Date(parseInt(dateStr.substr(6)));
}

function convertTCATNumToStr(TCATNum: number) {
    switch (TCATNum) {
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

export default {
    alerts,
};
