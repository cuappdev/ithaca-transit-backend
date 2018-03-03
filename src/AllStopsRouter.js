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
			let authHeader = await TokenUtils.getAuthorizationHeader();
			let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
				{headers: {Authorization: authHeader}});
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