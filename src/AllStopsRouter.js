// @flow
import TokenUtils from './TokenUtils';
import AbstractRouter from './AbstractRouter';
import axios from 'axios';
import qs from 'qs';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops', false);
    }

    async content(req: Request): Promise<any> {
    	try {
    		// generate or retrieve TCAT API access token
			let isAccessTokenExpired = TokenUtils.isAccessTokenExpired();
			let accessToken;
			if (isAccessTokenExpired) {
				accessToken = await TokenUtils.generateAccessToken();
			} else {
				accessToken = TokenUtils.getAccessToken();
			}
			
			// make request to TCAT API
			let apiAuth = 'Bearer ' + accessToken;
			let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
				{headers: {Authorization: apiAuth}});
			let allTcatStops = stopsRequest.data.map(stop => {
				return {
					name: stop.Name,
					lat: stop.Latitude,
					long: stop.Longitude
				}
			});
			return JSON.stringify(allTcatStops);
		} catch (err) {
			throw err;
		}
    }
}

export default new AllStopsRouter().router;