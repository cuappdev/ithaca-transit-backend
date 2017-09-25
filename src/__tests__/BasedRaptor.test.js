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
    console.log(result);
    expect(result[0].arrivalTime).toEqual(140);
    expect(result[1].arrivalTime).toEqual(260);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('2');
  });

  it('Basic Walking Transfer 1', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/3.json'));
    const result = await rapt.run();
    expect(result[0].arrivalTime).toEqual(240);
    console.log(result[0].path);

    // Peep the optimal path
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('1');
    expect(result[0].path[2].start.name).toEqual('1');
    expect(result[0].path[2].end.name).toEqual('2');
    expect(result[0].path[3].start.name).toEqual('2');
    expect(result[0].path[3].end.name).toEqual('3');
  });

  it('Prioritize Later But Faster Bus 1', async () => {
    const rapt = await TestUtils.raptorInstanceGenerator(fl('./data/4.json'));
    const result = await rapt.run();

    // Optimal path
    expect(result[0].arrivalTime).toEqual(200);
    expect(result[0].path[0].start.name).toEqual('Start');
    expect(result[0].path[0].end.name).toEqual('0');
    expect(result[0].path[1].start.name).toEqual('0');
    expect(result[0].path[1].end.name).toEqual('3');
  });
});
