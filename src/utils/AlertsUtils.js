// @flow
import { ALERTS } from './EnvUtils';
import RequestUtils from './RequestUtils';

async function fetchAlerts(): Object {
    const options = {
        method: 'GET',
        url: `http://${ALERTS || 'localhost'}:5000/alerts`,
        headers: { 'Cache-Control': 'no-cache' },
    };
    const data = await RequestUtils.createRequest(options, 'Alerts request failed');
    return JSON.parse(data);
}

export default {
    fetchAlerts,
};
