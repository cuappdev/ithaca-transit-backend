// @flow
import Constants from './Constants';
import { PYTHON_APP } from './EnvUtils';
import RequestUtils from './RequestUtils';

async function fetchRoutes(): Object {
  const options = {
    ...Constants.GET_OPTIONS,
    url: `http://${PYTHON_APP || 'localhost'}:5000/gtfs`,
  };
  const data = await RequestUtils.createRequest(options, 'Fetch routes request failed');
  return JSON.parse(data);
}

export default {
  fetchRoutes,
};
