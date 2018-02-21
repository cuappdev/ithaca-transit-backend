// @flow
import http from 'http';
import express, {Application, Request, Response} from 'express';
import axios from 'axios';
import qs from 'qs';

const app: Application = express();

app.get('/', (req: Request, res: express.Response) => {
  res.send('hello, world!');
});

app.get('/route', async (req: Request, res: express.Response) => {
  let start: string = req.query.start;
  let end: string = req.query.end;
  let departureTime: string = req.query.time;
  let departureTimeMilliseconds = parseFloat(departureTime) * 1000;
  let departureTimeDate = new Date(departureTimeMilliseconds).toISOString();
  try {
    let parameters: any = {
      locale: "en-US",
      vehicle: "pt",
      weighting: "fastest",
      point: [start, end]
    }
    parameters["pt.earliest_departure_time"] = departureTimeDate;
    let graphhopper: any = await axios.get('http://localhost:8989/route',{ 
      params: parameters,
      paramsSerializer: (params: any) => qs.stringify(params, { arrayFormat: 'repeat' })
    });
    res.send(graphhopper.data);
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
