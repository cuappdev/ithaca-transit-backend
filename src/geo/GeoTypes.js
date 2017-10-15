// @flow
import TimedStop from '../models/TimedStop';

export type PostProcessJourney = {
  stops: Array<TimedStop>,
}

export type PostProcessBus = {
  journeys: Array<PostProcessJourney>
};
