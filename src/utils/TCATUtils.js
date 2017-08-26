// @flow
import TCATConstants from './TCATConstants';

const stringTimeToSeconds = (strTime: string): number => {
  const colon = strTime.indexOf(':');
  const hour = parseInt(strTime.substring(0, colon));
  const min = parseInt(strTime.substring(colon + 1, colon + 3));
  const timeOfDay = strTime.substring(colon + 3);
  return (timeOfDay === 'AM' ? 0 : 12 * 60 * 60) + hour * 60 * 60 + min * 60;
};

const unixToWeekTime = (unixTimestamp: number): number => {
  const theDate = new Date(unixTimestamp * 1000);
  const days = theDate.getDay() - 1;
  const hours = theDate.getHours();
  const minutes = theDate.getMinutes();
  const seconds = theDate.getSeconds();
  return (
    days * TCATConstants.DAY +
    hours * TCATConstants.HOUR +
    minutes * TCATConstants.MINUTE +
    seconds
  );
};

const coordStringToCoords = (coordStr: string): Object => {
  const latLong = coordStr.split(',').map(n => parseFloat(n));
  return {
    latitude: latLong[0],
    longitude: latLong[1]
  };
};

export default {
  stringTimeToSeconds,
  unixToWeekTime,
  coordStringToCoords
};
