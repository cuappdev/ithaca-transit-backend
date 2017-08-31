// @flow
import { AppDevRouter } from 'appdev';
import { Request } from 'express';
import axios from 'axios';
import xml2js from 'xml2js';

class GetBusTrackingRouter extends AppDevRouter {
  constructor () {
    super('GET');
  }

  getPath (): string {
    return '/tracking/';
  }

  async content (req: Request) {
    const parseString = xml2js.parseString;
    const routeID = req.query.routeID;
    const baseURL = 'https://realtimetcatbus.availtec.com/InfoPoint/rest/Vehicles/GetAllVehiclesForRoute';
    axios.get(baseURL, {
      params: {
        routeID: routeID
      }
    })
      .then((response) => {
        parseString(response.data, function (err, result) {
          if (err) {
            return {
              success: false,
              data: []
            };
          }
          return {
            success: true,
            data: result
          };
        });
      })
      .catch(() => {
        return {
          success: false,
          data: []
        };
      });
  }
}

export default new GetBusTrackingRouter().router;
