// @flow
import { AppDevRouter } from 'appdev';
import LRU from 'lru-cache';
import HTTPRequestUtils from '../utils/HTTPRequestUtils';

const cacheOptions = {
    max: 10000,
    maxAge: 1000 * 60 * 60 * 24 * 5,
};
const cache = LRU(cacheOptions);

class PlacesAutocompleteRouter extends AppDevRouter<string> {
    constructor() {
        super('POST');
    }

    getPath(): string {
        return '/places/';
    }

    async content(req): Promise<any> {
        if (!req.body || !req.body.query || typeof req.body.query !== 'string') {
            return null;
        }

        const query = req.body.query.toLowerCase();
        const cachedValue = cache.get(query);

        if (cachedValue !== undefined) {
            return cachedValue;
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

        const autocompleteRequest = await HTTPRequestUtils.createRequest(options, 'Autocomplete request failed');

        if (autocompleteRequest) {
            const autocompleteResult = JSON.parse(autocompleteRequest);

            const { predictions } = autocompleteResult;
            const formattedPredictions = predictions.map(p => ({
                address: p.structured_formatting.secondary_text,
                name: p.structured_formatting.main_text,
                place_id: p.place_id,
            }));
            cache.set(query, formattedPredictions);
            return formattedPredictions;
        }
        return null;
    }
}

export default new PlacesAutocompleteRouter().router;
