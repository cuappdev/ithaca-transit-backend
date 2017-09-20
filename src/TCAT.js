// @flow
import Kml from './models/Kml';
import fs from 'fs';

type KmlJSON = {
  number: number,
  placemark: string
}

const kmlJSONs: Array<KmlJSON> = JSON.parse(
  fs.readFileSync(
    'data/kml.json',
    'utf8'
  )
);

const busNumberToKml = (() => {
  let result = {};
  for (let i = 0; i < kmlJSONs.length; i++) {
    var number = kmlJSONs[i].number;
    var placemark = kmlJSONs[i].placemark;
    result[number] = new Kml(number, placemark);
  }
  return result;
})();

export default {
  busNumberToKml
};
