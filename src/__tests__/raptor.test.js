/* eslint-disable no-undef */
import BasedRaptor from '../BasedRaptor';
import Bus from '../models/Bus';
import Location from '../models/Location';
import Path from '../models/Path';
import Stop from '../models/Stop';
import TimedStop from '../models/TimedStop';

describe('Flow API', () => {
  it('hello test', async () => {
    const stops = [
      new Stop(
        'Carpenter Hall',
        new Location(42.444889, -76.484993)
      ),
      new Stop(
        'Schwartz Performing Arts Center',
        new Location(42.442558, -76.485336)
      )
    ];

    const timedStops = [
      new TimedStop(stops[0], 1000, true),
      new TimedStop(stops[1], 2000, true)
    ];

    const path = new Path(timedStops);
    const bus = new Bus([path], 11);

    // CTB
    const start = new Stop('Start', new Location(42.442579, -76.485068));
    // Statler
    const end = new Stop('End', new Location(42.445627, -76.482600));
    // Footpath transitions
    const footpathMatrix = await BasedRaptorUtils.footpathMatrix(start, end);
    const buses = {11: bus};
    const stopsToRoutes = {
      'Carpenter Hall': 11,
      'Schwartz Performing Arts Center': 11
    };
    const rapt = new BasedRaptor(buses, start, end, stopsToRoutes, footpathMatrix, 900, stops);
    const result = await rapt.run();
    console.log(result);
  });
});
