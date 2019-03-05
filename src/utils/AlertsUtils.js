// @flow
import { PYTHON_APP } from './EnvUtils';
import RequestUtils from './RequestUtils';

const THREE_SEC_IN_MS = 3000;

async function fetchAlerts(): Object {
  const options = {
    method: 'GET',
    url: `http://${PYTHON_APP || 'localhost'}:5000/alerts`,
    headers: { 'Cache-Control': 'no-cache' },
    timeout: THREE_SEC_IN_MS,
  };
  const data = await RequestUtils.createRequest(options, 'Alerts request failed');
  return JSON.parse(data);
}

export default {
  fetchAlerts,
};
