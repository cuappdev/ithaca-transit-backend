// @flow
import Constants from './Constants';
import { PYTHON_APP } from './EnvUtils';
import RequestUtils from './RequestUtils';

async function fetchAlerts(): Object {
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
