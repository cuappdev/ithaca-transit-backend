/* eslint-disable no-undef */
import 'babel-polyfill';
import TestUtils from '../utils/TestUtils';

import path from 'path';

// fl == file
const fl = (p: string): string => {
  return path.join(__dirname, p);
};

describe('Raptor Test', () => {
  it('Basic 1', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/1.json'));
    const result = await rapt.run();
    expect(result[0].arrivalTime).toEqual(150);
    expect(result[1].arrivalTime).toEqual(320);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('1');
  });

  it('Basic 2', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/2.json'));
    const result = await rapt.run();
    expect(result[0].arrivalTime).toEqual(140);
    expect(result[1].arrivalTime).toEqual(260);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('2');
  });

  it('Basic 3', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/3.json'));
    const result = await rapt.run();
    expect(result[0].arrivalTime).toEqual(220);
    expect(result[1].arrivalTime).toEqual(225);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('3');
  });

  it('Skip over bus route', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/4.json'));
    const result = await rapt.run();
    expect(result[0].arrivalTime).toEqual(240);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('2');
    expect(result[0].path[1].start.name).toEqual('2');
    expect(result[0].path[1].end.name).toEqual('3');
  });
  /* Disabled - as per front-end request, even if walking is optimal, do not display
  it('Walking is fastest path', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/6.json'));
    const result = await rapt.run();

    // Peep the optimal path
    expect(result[0].arrivalTime).toEqual(1000);
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('End');
  });
  */

  it('Basic transfer', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/7.json'));
    const result = await rapt.run();

    expect(result[0].arrivalTime).toEqual(450);
    // Walk to Bus Stop 0
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    // Bus ending at Bus Stop 1
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('1');
    // Walk from Bus Stop 1 to Bus Stop 3
    expect(result[0].path[2].start.name).toEqual('1');
    expect(result[0].path[2].end.name).toEqual('2');
    // Bus ending at Bus Stop 4
    expect(result[0].path[3].start.name).toEqual('2');
    expect(result[0].path[3].end.name).toEqual('3');
    // Walk to End
    expect(result[0].path[4].start.name).toEqual('3');
    expect(result[0].path[4].end.name).toEqual('End');

    // TODO: Check other reccomended paths?

  });

});
