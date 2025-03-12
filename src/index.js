import delayRoutes from './controllers/DelaysController.js';
import routeRoutes from './controllers/RouteController.js';
import trackingRoutes from './controllers/TrackingController.js';
import searchRoutes from './controllers/SearchController.js';
import notifRoutes from './controllers/NotificationController.js'
import stopsRoutes from './controllers/StopsController.js'
import ecosystemRoutes from './controllers/EcosystemController.js'
import TokenUtils from './utils/TokenUtils.js';
import admin from 'firebase-admin';
import swaggerUi from 'swagger-ui-express'
import swaggerDoc from './swagger.json'  assert { type: 'json' };
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use('/', delayRoutes);

app.use('/', routeRoutes);

app.use('/', trackingRoutes);

app.use('/', searchRoutes);

app.use('/', stopsRoutes);

app.use('/', notifRoutes);

app.use('/', ecosystemRoutes);

TokenUtils.fetchAuthHeader();

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Setup Firebase Admin
console.log(process.env.FCM_AUTH_KEY_PATH);
admin.initializeApp({
  credential: admin.credential.cert(process.env.FCM_AUTH_KEY_PATH),
  databaseURL: 'https://ithaca-transit.firebaseio.com',
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});