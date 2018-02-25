// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';

class AllStopsRouter extends AbstractRouter {

    constructor() {
        super('GET', '/allStops/', false);
    }

    async content(req: Request): Promise<any> {
        const AuthStr = 'Bearer 5a54bc7f-a7df-3796-a83a-5bba7a8e31c8'; // Accept: "application/json"
        try {
            axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops',
                {headers: {Authorization: AuthStr}}).then(response => {
                let allStops = [];
                let tcatAllStops = response.data;
                for (let i = 0; i < tcatAllStops.length; i++) {
                    let stopData = tcatAllStops[i];
                    allStops.push({
                        name: stopData.Name,
                        lat: stopData.Latitude,
                        lon: stopData.Longitude
                    });
                }
                return JSON.stringify(allStops);
            })
        } catch (error) {
            return 'error ** ' + error;
        }
    }

}

export default new AllStopsRouter().router;