// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';
import qs from 'qs';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops', false);
    }

    async content(req: Request): Promise<any> {
    	let newTokenAttempts = 0;
    	var newTokenError = null;
    	do {
			let credentials = require("../config.json");
			let apiAuth = 'Bearer ' + credentials.access_token;
			try {
				let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
					{headers: {Authorization: apiAuth}});
				let allStopsTcat = stopsRequest.data.map(stop => {
					return {
						name: stop.Name,
						lat: stop.Latitude,
						long: stop.Longitude
					}
				});
				return JSON.stringify(allStopsTcat);
			} catch (error) {
				let errorCode = error.response.status;
				if (errorCode == 401) { // current access token is expired
					newTokenAttempts += 1;
					const tokenAuth = 'Basic ' + credentials.basic_token;
					const https = require('https');
					const agent = new https.Agent({  
					  rejectUnauthorized: false
					});
					try {
	 		            let tokenRequest = await axios.post('https://gateway.api.cloud.wso2.com:443/token', qs.stringify({"grant_type": "client_credentials"}), {
							httpsAgent: agent, 
							headers: {Authorization: tokenAuth}
	 		            });
						const fs = require('fs');
						const newCredentials = {basic_token: credentials.basic_token, 
												access_token: tokenRequest.data.access_token};
						fs.writeFile('config.json', JSON.stringify(newCredentials), 'utf8', function(err) {
							if (err)
								console.log(err);
						});
					} catch (error) {
						newTokenError = error;
					}
				} else { // unexpected error
					return 'error ** ' + error;
				}
			}
		} while (newTokenAttempts < 4);
		return 'error generating new token **' + newTokenError;
    }
}

export default new AllStopsRouter().router;