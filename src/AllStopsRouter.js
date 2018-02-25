// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops', true);
    }

    async content(req: Request): Promise<any> {
        const AuthStr = 'Bearer 5a54bc7f-a7df-3796-a83a-5bba7a8e31c8'; // Accept: "application/json"
        try {
            let stopsRequest = await axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
                {headers: {Authorization: AuthStr}});
            let tcatAllStops = stopsRequest.data.map(stop => {
                return {
                    name: stop.Name,
                    lat: stop.Latitude,
                    long: stop.Longitude
                }
            });
            return JSON.stringify(tcatAllStops);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

}

export default new AllStopsRouter().router;