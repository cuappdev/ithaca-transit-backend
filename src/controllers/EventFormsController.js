import express from "express";
import EventFormsUtils from "../utils/EventFormsUtils.js";

const router = express.Router();

// Create an event form
router.post("/create-event", async (req, res) => {
  try {
    const { netid, name, eventType, startDate, endDate, organizationName, location, about } = req.body;
    const eventForm = await EventFormsUtils.createEventForm({ netid, name, eventType, startDate, endDate, organizationName, location, about });
    res.status(201).json({ success: true, message: "Event request submitted successfully", data: eventForm });
  } catch (error) {
    console.error("Error creating event form:", error.message);
    res.status(400).json({ success: false, message: "Error submitting event request", error: error.message });
  }
});

// Get all event forms
router.get("/all-events", async (req, res) => {
  try {
    const eventForms = await EventFormsUtils.getAllEventForms();
    res.status(200).json({ success: true, message: "All event requests retrieved successfully", data: eventForms });
  } catch (error) {
    console.error("Error getting all event forms:", error.message);
    res.status(400).json({ success: false, message: "Error getting all event requests", error: error.message });
  }
});

export default router;