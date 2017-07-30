// @flow
import http from 'http';
import API from './API';

type Error = {
  errno?: number;
  code?: string;
  path?: string;
  syscall?: string;
};

const app: API = new API();
const port: number = 3000;
const server: http.Server = http.createServer(app.express);

const onError = (error: Error): void => {
  if (error.syscall !== 'listen') throw error;
  switch (error.code) {
  case 'EACCES':
    console.error(`${port} requires elevated privileges`);
    process.exit(1);
  case 'EADDRINUSE':
    console.error(`${port} is already in use`);
    process.exit(1);
  default:
    throw error;
  }
};

const onListening = (): void => {
  let addr: Object = server.address();
  console.log(`Listening on ${addr.port}`);
};

// Configures server
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
