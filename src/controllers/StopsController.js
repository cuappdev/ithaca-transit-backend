import express from "express";
import AllStopUtils from "../utils/AllStopUtils.js";

const router = express.Router();

// Define a route to fetch all stops
router.get("/allStops", async (req, res) => {
  try {
    const allStops = await AllStopUtils.getAllStops();
    res.status(200).json(allStops);
  } catch (error) {
    console.error("Error fetching all stops:", error.message);
    res.status(500).json({ error: "Failed to fetch all stops" });
  }
});

export default router;
