// @flow
import LRU from 'lru-cache';
import AllStopUtils from '../utils/AllStopUtils';
import ApplicationRouter from '../appdev/ApplicationRouter';
import RequestUtils from '../utils/RequestUtils';

const BUS_STOP = 'busStop';
const cacheOptions = {
    max: 10000,
    maxAge: 1000 * 60 * 60 * 24 * 5,
};
const cache = LRU(cacheOptions);
const GOOGLE_PLACE = 'googlePlace';

class SearchRouter extends ApplicationRouter<string> {
    constructor() {
        super(['POST']);
    }

    getPath(): string {
        return '/search/';
    }

    async content(req): Promise<any> {
        if (!req.body || !req.body.query || typeof req.body.query !== 'string') {
            return null;
        }

        const query = req.body.query.toLowerCase();
        const cachedValue = cache.get(query);

        const allStops = await AllStopUtils.fetchAllStops();
        const formattedStops = allStops.map(s => ({
            type: BUS_STOP,
            lat: s.lat,
            long: s.long,
            name: s.name,
        }));

        if (cachedValue !== undefined) {
            const places = cachedValue.concat(formattedStops);
            return places;
        }

        // not in cache
        const options = {
            method: 'GET',
            url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            qs: {
                input: query,
                key: process.env.PLACES_KEY,
                location: '42.4440,-76.5019',
                radius: 24140,
                strictbounds: '',
            },
        };

        const autocompleteRequest = await RequestUtils.createRequest(options, 'Autocomplete request failed');

        if (autocompleteRequest) {
            const autocompleteResult = JSON.parse(autocompleteRequest);

            const { predictions } = autocompleteResult;
            const googlePredictions = predictions.map(p => ({
                type: GOOGLE_PLACE,
                detail: p.structured_formatting.secondary_text,
                name: p.structured_formatting.main_text,
                placeID: p.place_id,
            }));
            cache.set(query, googlePredictions);

            const places = formattedStops.concat(googlePredictions);
            return places;
        }
        return null;
    }
}

export default new SearchRouter().router;
