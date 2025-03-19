import express from "express";
import RealtimeFeedUtilsV3 from "../utils/RealtimeFeedUtilsV3.js";
import AlertsUtils from "../utils/AlertsUtils.js";

const router = express.Router();
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await AlertsUtils.getAlertsData();
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

router.post("/delays", async (req, res) => {
  try {
    const rtf = await RealtimeFeedUtilsV3.getRTFData();

    const delays = await Promise.all(
      req.body.data.map(async ({ stopId, tripId }) => {
        const res = await RealtimeFeedUtilsV3.getDelayInformation(
          stopId,
          tripId,
          rtf
        );
        return {
          stopId,
          tripId,
          delay: res ? res.delay : null,
        };
      })
    );

    res.status(200).json(delays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
