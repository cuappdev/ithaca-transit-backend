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

  it('Walking is fastest path', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/6.json'));
    const result = await rapt.run();

    // TODO: Optimal path
    expect(result[0].arrivalTime).toEqual(1000);
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('End');
  });
});
