// @flow
import { PYTHON_APP, PYTHON_PORT } from './EnvUtils';
import RequestUtils from './RequestUtils';

async function fetchRoutes(): Object {
  const options = {
    method: 'GET',
    url: `http://${PYTHON_APP || 'localhost'}:${+PYTHON_PORT}/gtfs`,
    headers: { 'Cache-Control': 'no-cache' },
  };
  const data = await RequestUtils.createRequest(options, 'Fetch routes request failed');
  return JSON.parse(data);
}

async function getFeedInfo(): Object {
  const options = {
    method: 'GET',
    url: `http://${PYTHON_APP || 'localhost'}:${+PYTHON_PORT}/gtfs-feed-info`,
    headers: { 'Cache-Control': 'no-cache' },
  };
  const data = await RequestUtils.createRequest(options, 'Get GTFS feed info request failed');
  return JSON.parse(data);
}

export default {
  fetchRoutes,
  getFeedInfo,
};
