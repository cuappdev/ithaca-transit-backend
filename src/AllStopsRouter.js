// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops', false);
    }

    async content(req: Request): Promise<any> {
		let credentials = require("../config.json");
        const apiAuth = 'Bearer ' + credentials.access_token;
        try {
            let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
                {headers: {Authorization: apiAuth}});
            let tcatAllStops = stopsRequest.data.map(stop => {
                return {
                    name: stop.Name,
                    lat: stop.Latitude,
                    long: stop.Longitude
                }
            });
            return JSON.stringify(tcatAllStops);
        } catch (error) {
			let errorCode = error.response.status;
			if (errorCode == 401) { // need to generate new access token
				const tokenAuth = 'Basic ' + credentials.basic_token;
				try {
					// need to somehow disable SSL verification from this domain using axios
		            let tokenRequest = await axios.post('https://gateway.api.cloud.wso2.com:443/token',
        		        {headers: {Authorization: tokenAuth, 'Content-Type': 'application/x-www-form-urlencoded'}, data: {"grant_type": "client_credentials"}});
        		    return tokenRequest.data;
				} catch (error) {
					return 'error *** ' + error;
				}
			}
            return 'error ** ' + error;
        }
    }

}

export default new AllStopsRouter().router;