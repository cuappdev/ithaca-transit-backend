// @flow
import http from 'http';
import express, {Application, Request, Response} from 'express';
import axios from 'axios';
import qs from 'qs';

const app: Application = express();

app.get('/', (req: Request, res: express.Response) => {
  res.send('hello, world!');
});

app.get('/allStops/', async (req: Request, res: express.Response) => {
	const AuthStr = 'Bearer 5a54bc7f-a7df-3796-a83a-5bba7a8e31c8'; // Accept: "application/json"
    axios.get('https://gateway.api.cloud.wso2.com:443/t/mystop/tcat/v1/rest/Stops/GetAllStops', { headers: { Authorization: AuthStr } }).then(response => {
    		var allStops = [];
    		let tcatAllStops = response.data;
    		for (var i = 0; i < tcatAllStops.length; i++) {
    			let stopData = tcatAllStops[i];
    			allStops.push({
								name: stopData.Name,
								lat: stopData.Latitude,
								lon: stopData.Longitude
				});
    		}
    		res.send(JSON.stringify(allStops));
          })
          .catch((error) => {
            res.send('error ** ' + error);
          });
});

app.get('/route', async (req: Request, res: express.Response) => {
  let start: string = req.query.start;
  let end: string = req.query.end;
  let departureTimeQuery: string = req.query.time;
  let departureTimeMilliseconds = parseFloat(departureTimeQuery) * 1000;
  let departureTimeDate = new Date(departureTimeMilliseconds).toISOString();
  try {
    let parameters: any = {
      locale: "en-US",
      vehicle: "pt",
      weighting: "fastest",
      point: [start, end],
      points_encoded: false
    }
    parameters["pt.earliest_departure_time"] = departureTimeDate;
    let graphhopper: any = await axios.get('http://localhost:8989/route',{ 
      params: parameters,
      paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
    });

    //create the correct json response based on TCAT REST API doc
    let resp = graphhopper.data;
    let paths = resp.paths; //this is an array of possible routes
    var possibleRoutes = [];
    for (let index = 0; index < paths.length; index++) {

      let currPath = paths[index]; // object {}
      let totalTime = currPath.time; //total time for journey, in milliseconds
      let numberOfTransfers = currPath.transfers;
      let legs = currPath.legs //array containing legs of journey. e.g. walk, bus ride, walk
      let amountOfLegs = legs.length;
      let departureTime = legs[0].departureTime; //string 2018-02-21T17:27:00Z
      let arriveTime = legs[amountOfLegs - 1].arrivalTime;//string 2018-02-21T17:30:53Z
      let startingLocationGeometry = legs[0].geometry;
      let endingLocationGeometry = legs[amountOfLegs - 1].geometry;

      let startingLocationLong = startingLocationGeometry.coordinates[0][0] //name implies
      let startingLocationLat = startingLocationGeometry.coordinates[0][1]

      let endingLocationLong = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][0]
      let endingLocationLat = endingLocationGeometry.coordinates[endingLocationGeometry.coordinates.length - 1][1]

      let startCoords = {
        lat: startingLocationLat,
        long: startingLocationLong
      };

      let endCoords = {
        lat: endingLocationLat,
        long: endingLocationLong
      };

      let boundingBox = {
        minLat: currPath.bbox[1],
        minLong: currPath.bbox[0],
        maxLat: currPath.bbox[3],
        maxLong: currPath.bbox[2]
      };

      var directions = [];
      for (let j = 0; j < amountOfLegs; j++) {

        let currLeg = legs[j];
        var type = currLeg.type;
        if (type == "pt") {
          type = "depart";
        }

        var name = ""
        if (type == "walk") {
          if (j == amountOfLegs - 1) { //means we are at the last direction aka a walk. name needs to equal final destination
            name = "your destination";
          } else {
            name = legs[j + 1].departureLocation
          }
        } else if (type == "depart") {
          name = currLeg.departureLocation;
        }

        let startTime = currLeg.departureTime;
        let endTime = currLeg.arrivalTime;
        
        let currCoordinates = currLeg.geometry.coordinates //array of array of coordinates
        let path = currCoordinates.map( point => {
          return {
            lat: point[1],
            long: point[0]
          }
        });

        let startLocation = path[0];
        let endLocation = path[path.length - 1];

        let distance = currLeg.distance;
        
        var routeNumber = type == "depart" ? 99 : null;

        var stops = [];
        if (type == "depart") {
          stops = currLeg.stops.map(stop => {
            return {
              name: stop.stop_name,
              lat: stop.geometry.coordinates[1],
              long: stop.geometry.coordinates[0]
            }
          })
        }
        directions.push( {
          type: type,
          name: name,
          startTime: startTime,
          endTime: endTime,
          startLocation: startLocation,
          endLocation: endLocation,
          path: path,
          distance: distance,
          routeNumber: routeNumber,
          stops: stops
        })
      }

      possibleRoutes.push( {
        departureTime: departureTime,
        arrivalTime: arriveTime,
        directions: directions,
        startCoords: startCoords,
        endCoords: endCoords,
        boundingBox: boundingBox,
        numberOfTransfers: numberOfTransfers
      })

    }
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(possibleRoutes));
  } catch (err) {
    console.log(err);
    res.send("rip");
  }
});

const port: number = parseInt(process.env.PORT) || 3000;
const server: http.Server = http.createServer(app);

const onError = (error: Error): void => {
  console.log(error);
  process.exit(1);
};

const onListening = (): void => {
  let addr: Object = server.address();
  console.log(`Listening on ${addr.port}`);
};

// Configures server
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
