
import Constants from './Constants.js';
import { PYTHON_APP } from './EnvUtils.js';
import RequestUtils from './RequestUtils.js';

async function fetchAlerts() {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/alerts`,
  };
  const data = await RequestUtils.createRequest(options, 'Alerts request failed');
  return JSON.parse(data);
}

export default {
  fetchAlerts,
};
