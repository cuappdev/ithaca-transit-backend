
import { PYTHON_APP } from './EnvUtils.js';
import RequestUtils from './RequestUtils.js';

async function fetchRoutes(){
  const options = {
    method: 'GET',
    url: `http://${PYTHON_APP || 'localhost'}:5000/gtfs`,
    headers: { 'Cache-Control': 'no-cache' },
  };
  const data = await RequestUtils.createRequest(options, 'Fetch routes request failed');
  return JSON.parse(data);
}

export default {
  fetchRoutes,
};
