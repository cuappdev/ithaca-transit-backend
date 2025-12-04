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
import eventFormsRoutes from "./controllers/EventFormsController.js";

import NotificationUtils from "./utils/NotificationUtils.js";
import RealtimeFeedUtilsV3 from "./utils/RealtimeFeedUtilsV3.js";

import admin from "firebase-admin";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger.json" with { type: "json" };
import AlertsUtils from "./utils/AlertsUtils.js";
import AllStopUtils from "./utils/AllStopUtils.js";
import GTFSUtils from "./utils/GTFSUtils.js";

import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io"; 

const app = express();
const port = process.env.PORT;

const httpServer = createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: `http://localhost:${port}`, // Come back to, update URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set the io instance to the app, so it can be accessed by the controllers
app.set("io", io);

app.use(express.json());

app.use('/api/v1/', delayRoutes);

app.use('/api/v3/', routeRoutes);

app.use('/api/v3/', trackingRoutes);

app.use('/api/v2/', searchRoutes);

app.use('/api/v1/', stopsRoutes);

app.use('/api/v1/', notifRoutes);

app.use('/api/v1/', reportingRoutes);

app.use('/api/v1/', ecosystemRoutes);

app.use('/api/v1/', eventFormsRoutes);

// Setup Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Setup recurring events (every 30 seconds)
schedule.scheduleJob("*/30 * * * * *", async () => {
  AlertsUtils.fetchAlerts();
  await RealtimeFeedUtilsV3.fetchRTF();
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

const ALLOWED_ROLES = ['admin', 'user'];

// Handle a given socket's connections
io.on("connection", (socket) => {
  // Log the socket connection 
  console.log("Client connected: ", socket.id);
  
  // Identify the socket's
  socket.on("identify", ({role, netid}) => {

    // Safety checks - make sure the netid and role are valid
    if (!netid || !role) {
      console.error("Invalid netid or role - netid and role are required");
      socket.emit("identify:error", {message: "Invalid netid or role - netid and role are required"});
      return;
    };

    // Ensures role is valid
    if (!ALLOWED_ROLES.includes(role)) {
      console.error("Invalid role - role must be one of: " + ALLOWED_ROLES.join(", "));
      socket.emit("identify:error", {message: "Invalid role - role must be one of: " + ALLOWED_ROLES.join(", ")});
      return;
    };

    // Makes the socket a member of the public room — done only after all other checks pass
    socket.join("public");

    // Set the socket's data
    socket.data.netid = netid;
    socket.data.role = role;
    console.log("Socket identified: ", socket.data);

    if (role === 'admin') {
      socket.join("admin");
    }

    if (role === 'user') {
      socket.join(`netid:${netid}`);
    }
  });

  // Log the socket disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
