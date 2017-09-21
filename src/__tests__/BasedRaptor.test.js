/* eslint-disable no-undef */
import 'babel-polyfill';

import BasedRaptor from '../BasedRaptor';
import BasedRaptorUtils from '../utils/BasedRaptorUtils';
import Location from '../models/Location';
import Stop from '../models/Stop';
import TestUtils from '../utils/TestUtils';

const raptorInstanceGenerator = async (path: string): BasedRaptor => {
  const testJson = require(path);
  const raptorInput = TestUtils.generateDataStructures(testJson);
  const footpathMatrix =
    await BasedRaptorUtils.footpathMatrix(raptorInput.start, raptorInput.end);
  return new BasedRaptor(
    raptorInput.buses,
    raptorInput.start,
    raptorInput.end,
    raptorInput.stopsToRoutes,
    footpathMatrix,
    raptorInput.startTime,
    raptorInput.stops
  );
}

describe('Raptor Test', () => {
  it('Basic Test', async () => {
    const rapt = await raptorInstanceGenerator('../__tests__/test_data/first_test.json');
    const result = await rapt.run();
    console.log(result);
  });
  it('Basic Test', async () => {
    const rapt = await raptorInstanceGenerator("../__tests__/test_data/second_test.json");
    const result = await rapt.run();
    console.log(result);
  });
});
