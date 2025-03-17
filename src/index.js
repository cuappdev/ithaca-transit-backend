import "dotenv/config";
import express from "express";
import delayRoutes from "./controllers/DelaysController.js";
import routeRoutes from "./controllers/RouteController.js";
import trackingRoutes from "./controllers/TrackingController.js";
import searchRoutes from "./controllers/SearchController.js";
import notifRoutes from "./controllers/NotificationController.js";
import reportingRoutes from "./controllers/RouteReportingController.js";
import stopsRoutes from "./controllers/StopsController.js";
import ecosystemRoutes from "./controllers/EcosystemController.js";
import TokenUtils from "./utils/TokenUtils.js";
import admin from "firebase-admin";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger.json" with { type: "json" };

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use("/", delayRoutes);

app.use("/", routeRoutes);

app.use("/", trackingRoutes);

app.use("/", searchRoutes);

app.use("/", stopsRoutes);

app.use("/", notifRoutes);

app.use("/", ecosystemRoutes);

app.use("/", reportingRoutes);

TokenUtils.fetchAuthHeader();

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Setup Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(process.env.FCM_AUTH_KEY_PATH),
  databaseURL: "https://ithaca-transit.firebaseio.com",
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
