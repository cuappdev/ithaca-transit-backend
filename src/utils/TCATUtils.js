// @flow

const stringTimeToSeconds = (strTime: string): number => {
  const colon = strTime.indexOf(':');
  const hour = parseInt(strTime.substring(0, colon));
  const min = parseInt(strTime.substring(colon + 1, colon + 3));
  const timeOfDay = strTime.substring(colon + 3);
  return (timeOfDay === 'AM' ? 0 : 12 * 60 * 60) + hour * 60 * 60 + min * 60;
};

export default {
  stringTimeToSeconds
};
