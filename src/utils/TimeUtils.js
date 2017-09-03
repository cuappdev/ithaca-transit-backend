// @flow
import TCATConstants from './TCATConstants';

const stringTimeDayToWeekTime = (stringTime: string, day: number): number => {
  const timeComponents = stringTime.split(":").map(d => +d);
  return (
    day * TCATConstants.DAY +
    timeComponents[0] * TCATConstants.HOUR +
    timeComponents[1] * TCATConstants.MINUTE +
    timeComponents[2]
  );
};

export default {
    stringTimeDayToWeekTime
}
