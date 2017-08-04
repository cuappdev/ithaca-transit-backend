import OSRM from 'osrm';

const osrm = new OSRM('osrm/map.osrm');

const table = (options: Object): Promise<any> => {
  return new Promise((resolve, reject) => {
    osrm.table(options, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

export default {
  table
};
