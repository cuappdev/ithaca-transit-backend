// @flow
import TCATConstants from './TCATConstants';

const stringTimeToWeekTime = (stringTime: string): number => {
  const timeComponents = stringTime.split(":").map(d => +d);
  return (
    timeComponents[0] * TCATConstants.HOUR +
    timeComponents[1] * TCATConstants.MINUTE +
    timeComponents[2]
  );
};

export default {
    stringTimeToWeekTime
}
