/* eslint-disable no-undef */
import 'babel-polyfill';
import TestUtils from '../utils/TestUtils';

import path from 'path';

describe('Raptor Test', () => {
  it('Basic Test', async () => {
    const rapt =
      await TestUtils.raptorInstanceGenerator(
        path.join(__dirname, './data/1.json')
      );
    const result = await rapt.run();
    expect(result[0].arrivalTime === 150); // 0 -> 10 -> 100 -> 150
    expect(result[1].arrivalTime === 320); // 0 -> 320

    // Peep the first response
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('1');
  });
});
