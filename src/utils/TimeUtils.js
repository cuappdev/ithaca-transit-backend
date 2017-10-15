// @flow
import TCATConstants from './TCATConstants';

const stringTimeDayToWeekTime = (stringTime: string, day: number): number => {
  const timeComponents = stringTime.split(':').map(d => +d);
  return (
    day * TCATConstants.DAY +
    timeComponents[0] * TCATConstants.HOUR +
    timeComponents[1] * TCATConstants.MINUTE +
    timeComponents[2]
  );
};

const unixTimeToDayTime = (unixTimestamp: number): number => {
  const theDate = new Date(unixTimestamp * 1000);
  const hours = theDate.getHours();
  const minutes = theDate.getMinutes();
  const seconds = theDate.getSeconds();
  return (
    hours * TCATConstants.HOUR +
    minutes * TCATConstants.MINUTE +
    seconds
  );
};

const unixTimeToGTFSDate = (unixTimestamp: number): number => {
  const theDate = new Date(unixTimestamp * 1000);
  const day = theDate.getDate();
  const month = theDate.getMonth() + 1;
  const year = theDate.getFullYear();
  return (
    year * 10000 +
    month * 100 +
    day
  );
};

export default {
  stringTimeDayToWeekTime,
  unixTimeToDayTime,
  unixTimeToGTFSDate
};
