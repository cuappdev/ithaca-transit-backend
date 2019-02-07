// @flow
import { PYTHON_APP } from './EnvUtils';
import RequestUtils from './RequestUtils';

async function fetchRoutes(): Object {
    const options = {
        method: 'GET',
        url: `http://${PYTHON_APP || 'localhost'}:5000/gtfs`,
        headers: { 'Cache-Control': 'no-cache' },
    };
    const data = await RequestUtils.createRequest(options, 'Alerts request failed');
    return JSON.parse(data);
}

export default {
    fetchRoutes,
};
