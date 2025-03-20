import "dotenv/config";
import express from "express";
import schedule from "node-schedule";

import delayRoutes from "./controllers/DelaysController.js";
import routeRoutes from "./controllers/RouteController.js";
import trackingRoutes from "./controllers/TrackingController.js";
import searchRoutes from "./controllers/SearchController.js";
import notifRoutes from "./controllers/NotificationController.js";
import reportingRoutes from "./controllers/RouteReportingController.js";
import stopsRoutes from "./controllers/StopsController.js";
import ecosystemRoutes from "./controllers/EcosystemController.js";

import NotificationUtils from "./utils/NotificationUtils.js";
import RealtimeFeedUtilsV3 from "./utils/RealtimeFeedUtilsV3.js";

import admin from "firebase-admin";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger.json" with { type: "json" };
import AlertsUtils from "./utils/AlertsUtils.js";
import AllStopUtils from "./utils/AllStopUtils.js";
import GTFSUtils from "./utils/GTFSUtils.js";


const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use('/api/v1/', delayRoutes);

app.use('/api/v3/', routeRoutes);

app.use('/api/v3/', trackingRoutes);

app.use('/api/v2/', searchRoutes);

app.use('/api/v1/', stopsRoutes);

app.use('/api/v1/', notifRoutes);

app.use('/api/v1/', reportingRoutes);

app.use('/api/v1/', ecosystemRoutes);

// Setup Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Setup recurring events (every 30 seconds)
schedule.scheduleJob("*/30 * * * * *", () => {
  AlertsUtils.fetchAlerts();
  RealtimeFeedUtilsV3.fetchRTF();
  AllStopUtils.fetchAllStops();
  RealtimeFeedUtilsV3.fetchVehicles();
  NotificationUtils.sendNotifications();
});

// Retrieve GTFS data
GTFSUtils.fetchGTFS();

// Setup Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(process.env.FCM_AUTH_KEY_PATH),
  databaseURL: "https://ithaca-transit.firebaseio.com",
});

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
