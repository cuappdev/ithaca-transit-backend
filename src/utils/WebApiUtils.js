// @flow

import axios from 'axios';

const webApiCall = (endpoint: string): any => {
  const callFunction = async function (params: any = {}) {
    const baseURL = 'https://realtimetcatbus.availtec.com/InfoPoint';
    const fullURL = baseURL + endpoint;
    try {
      const response = await axios.get(baseURL, {
        params: params
      }); 
      return response.data;
    } catch (error) {
      // TODO log error on backend but pass in a
      // presentable string so frontend can display it
      throw new Error(error);
    }
  }
  return callFunction;
}

export default { 
  webApiCall 
};
