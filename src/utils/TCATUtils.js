// @flow
const coordStringToCoords = (coordStr: string): Object => {
  const latLong = coordStr.split(',').map(n => parseFloat(n));
  return {
    latitude: latLong[0],
    longitude: latLong[1]
  };
};

export default {
  coordStringToCoords
};
