// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import axios from 'axios';
import LRU from 'lru-cache';

const options = {
    max: 10000,
    maxAge: 1000 * 60 * 60 * 24 * 5,
};
const cache = LRU(options);

class PlacesAutocompleteRouter extends AppDevRouter<string> {
    constructor() {
        super('POST');
    }

    getPath(): string {
        return '/places/';
    }

    async content(req: Request): Promise<any> {
        const query = req.body.query.toLowerCase();
        const cachedValue = cache.get(query);

        if (cachedValue !== undefined) {
            return cachedValue;
        }

        // not in cache
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            {
                params: {
                    location: '42.4440,-76.5019',
                    key: process.env.PLACES_KEY,
                    input: query,
                    radius: 24140,
                    strictbounds: '',
                },
            },
        );

        const predictions = response.data.predictions;
        const formattedPredictions = predictions.map(p => ({
            address: p.structured_formatting.secondary_text,
            name: p.structured_formatting.main_text,
            place_id: p.place_id,
        }));
        cache.set(query, formattedPredictions);
        return formattedPredictions;
    }
}

export default new PlacesAutocompleteRouter().router;
