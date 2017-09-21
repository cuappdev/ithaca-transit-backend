/* eslint-disable no-undef */
import 'babel-polyfill';

import BasedRaptor from '../BasedRaptor';
import BasedRaptorUtils from '../utils/BasedRaptorUtils';
import Location from '../models/Location';
import Stop from '../models/Stop';
import TestUtils from '../utils/TestUtils';

describe('Raptor Test', () => {
  it('Basic Test', async () => {
    const testCase = {
      stops: [
        {
          name: 'Schwartz Performing Arts Center',
          lat: 42.442558,
          long: -76.485336
        },
        {
          name: 'Carpenter Hall',
          lat: 42.444889,
          long: -76.484993
        }
      ],
      buses: [{
        lineNumber: 10,
        paths: [[{stopIndex: 0, time: 1000}, {stopIndex: 1, time: 2000}]]
      }]
    };

    // Generate data-structures from testCase JSON
    const raptorInput = TestUtils.generateDataStructures(testCase);
    // CTB
    const start = new Stop('Start', new Location(42.442579, -76.485068));
    // Statler
    const end = new Stop('End', new Location(42.445627, -76.482600));
    // Footpath transitions
    const footpathMatrix = await BasedRaptorUtils.footpathMatrix(start, end);
    // Raptor instance
    const rapt = new BasedRaptor(
      raptorInput.buses,
      start,
      end,
      raptorInput.stopsToRoutes,
      footpathMatrix,
      900,
      raptorInput.stops
    );

    // Run + check
    const result = await rapt.run();
    console.log(result);
  });
  it('Basic Test', async () => {
    const testCase = {
      stops: [
        {
          name: 'Schwartz Performing Arts Center',
          lat: 42.442558,
          long: -76.485336
        },
        {
          name: 'Carpenter Hall',
          lat: 42.444889,
          long: -76.484993
        }
      ],
      buses: [{
        lineNumber: 10,
        paths: [[{stopIndex: 0, time: 960}, {stopIndex: 1, time: 1200}]]
      }]
    };

    // Generate data-structures from testCase JSON
    const raptorInput = TestUtils.generateDataStructures(testCase);
    // CTB
    const start = new Stop('Start', new Location(42.442579, -76.485068));
    // Statler
    const end = new Stop('End', new Location(42.445627, -76.482600));
    // Footpath transitions
    const footpathMatrix = await BasedRaptorUtils.footpathMatrix(start, end);
    // Raptor instance
    const rapt = new BasedRaptor(
      raptorInput.buses,
      start,
      end,
      raptorInput.stopsToRoutes,
      footpathMatrix,
      900,
      raptorInput.stops
    );

    // Run + check
    const result = await rapt.run();
    console.log(result);
  });
});
