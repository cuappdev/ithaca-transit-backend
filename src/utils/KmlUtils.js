// @flow
const rotatedArray = (arr: Array<any>, count: number): Array<any> => {
  count -= arr.length * Math.floor(count / arr.length);
  arr.push.apply(arr, arr.splice(0, count));
  return arr;
};

export default {
  rotatedArray
};
