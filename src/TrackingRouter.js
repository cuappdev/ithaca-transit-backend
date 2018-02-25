// @flow
import AbstractRouter from './AbstractRouter';
import axios from 'axios';

class TrackingRouter extends AbstractRouter {

    constructor() {
        super('GET', '/tracking/', false);
    }

    async content(req: Request): Promise<any> {
        let routeID = req.query.routeID;
        const AuthStr = 'Bearer 5a54bc7f-a7df-3796-a83a-5bba7a8e31c8';
        axios.get('https://realtimetcatbus.availtec.com/InfoPoint/rest/Vehicles/GetAllVehiclesForRoute?routeID=' + routeID, {headers: {Authorization: AuthStr}}).then(response => {
            return response.data;
        }).catch((error) => {
            return 'error ** ' + error;
        });
    }

}

export default new TrackingRouter().router;