import express from "express";
import NotificationUtils from "../utils/NotificationUtils.js";

const router = express.Router();

router.post("/delayNotification", async (req, res) => {
  const { deviceToken, tripID, stopID } = req.body;

  if (
    !deviceToken ||
    typeof deviceToken !== "string" ||
    !stopID ||
    typeof stopID !== "string" ||
    !tripID ||
    typeof tripID !== "string"
  ) {
    return res.status(400).json({ 
      success: false, 
      data: "Invalid input parameters" 
    });
  }

  try {
    NotificationUtils.addDelayNotification(tripID, stopID, deviceToken);
    res.status(200).json({ 
      success: true, 
      data: "successfully registered delay notification" 
    });
  } catch (error) {
    console.error("Error setting up delay notification:", error.message);
    res.status(500).json({ 
      success: false, 
      data: "Failed to set up delay notification" 
    });
  }
});

router.post("/cancelDelayNotification", async (req, res) => {
  const { deviceToken, tripID, stopID } = req.body;

  if (
    !deviceToken ||
    typeof deviceToken !== "string" ||
    !tripID ||
    typeof tripID !== "string" ||
    !stopID ||
    typeof stopID !== "string"
  ) {
    return res.status(400).json({ 
      success: false, 
      data: "Invalid input parameters" 
    });
  }

  try {
    NotificationUtils.deleteDelayNotification(tripID, stopID, deviceToken);
    res.status(200).json({ 
      success: true, 
      data: "successfully cancelled delay notification" 
    });
  } catch (error) {
    console.error("Error canceling delay notification:", error.message);
    res.status(500).json({ 
      success: false, 
      data: "Failed to cancel delay notification" 
    });
  }
});

// Handle departure notifications
router.post("/departureNotification", async (req, res) => {
  try {
    const { deviceToken, startTime } = req.body;

    // Validate request body
    if (
      !deviceToken ||
      typeof deviceToken !== "string" ||
      !startTime ||
      typeof startTime !== "string"
    ) {
      return res.status(400).json({ 
        success: false, 
        data: "Invalid input parameters" 
      });
    }

    // Call the utility function to set up the departure notification
    const result = await NotificationUtils.waitForDeparture(
      deviceToken,
      startTime
    );

    // Respond with the result
    res.status(200).json({ 
      success: true, 
      data: "successfully scheduled departure notification" 
    });
  } catch (error) {
    console.error("Error setting up departure notification:", error.message);
    res.status(500).json({ 
      success: false, 
      data: "Failed to set up departure notification" 
    });
  }
});

// Cancel departure notification
router.post("/cancelDepartureNotification", async (req, res) => {
  try {
    const { deviceToken, startTime } = req.body;

    // Validate request body
    if (
      !deviceToken ||
      typeof deviceToken !== "string" ||
      !startTime ||
      typeof startTime !== "string"
    ) {
      return res.status(400).json({ 
        success: false, 
        data: "Invalid input parameters" 
      });
    }

    // Call the utility function to cancel the departure notification
    const result = await NotificationUtils.cancelDeparture(
      deviceToken,
      startTime
    );

    // Respond with the result
    res.status(200).json({ 
      success: true, 
      data: "successfully canceled departure notification" 
    });
  } catch (error) {
    console.error("Error canceling departure notification:", error.message);
    res.status(500).json({ 
      success: false, 
      data: "Failed to cancel departure notification" 
    });
  }
});

router.post("/microserviceNotif", async (req, res) => {
  try {
    const { deviceToken, routeID } = req.body;

    // Validate the request body
    if (
      !deviceToken ||
      typeof deviceToken !== "string" ||
      !routeID ||
      typeof routeID !== "string"
    ) {
      return res.status(400).json({ 
        success: false, 
        data: "Invalid input parameters" 
      });
    }

    // Send the notification
    await NotificationUtils.sendNotification(
      deviceToken,
      `The bus on ${routeID} is delayed`,
      "testBody"
    );
    return res.status(200).json({ 
      success: true, 
      data: "successfully sent microservice notification" 
    });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ 
      success: false, 
      data: "Failed to send notification" 
    });
  }
});

export default router;
