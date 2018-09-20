// @flow
import { AppDevRouter } from 'appdev';
import type Request from 'express';
import axios from 'axios';
import request from 'request';
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
        const options = {
            method: 'GET',
            url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            qs:
                {
                    location: '42.4440,-76.5019',
                    key: process.env.PLACES_KEY,
                    input: query,
                    radius: 24140,
                    strictbounds: '',
                }
        };

        const AutocompleteRequest = JSON.parse(await new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) reject(error);
                console.log(response);
                resolve(body);
            });
        }).then(value => value).catch((error) => {
            ErrorUtils.log(error, null, 'Autocomplete request failed');
            return null;
        }));

        console.log('autocomplete req', AutocompleteRequest);

        const { predictions } = AutocompleteRequest.data;
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
