// NO FLOW b/c osrm library is not-well-typed according to our Flow version
import OSRM from 'osrm';

const footOSRM = new OSRM('osrm/foot/map.osrm');
const carOSRM = new OSRM('osrm/car/map.osrm');

const genTableFunction = (osrm) => {
  return (options: Object): Promise<any> => {
    return new Promise((resolve, reject) => {
      osrm.table(options, (err, response) => {
        if (err) reject(err);
        resolve(response);
      });
    });
  };
};

const footTable = genTableFunction(footOSRM);
const carTable = genTableFunction(carOSRM);

export default { footTable, carTable };
