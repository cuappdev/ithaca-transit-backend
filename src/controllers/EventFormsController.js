import express from "express";
import { createEventForm, getAllEventForms, updateEventForm, getApprovedEventForms, toPublicEvent } from "../utils/EventFormsUtils.js";

const router = express.Router();

// Create an event form
router.post("/events/create-event", async (req, res) => {
  try {
    const { netid, name, eventType, startDate, endDate, organizationName, location, about } = req.body;
    const eventForm = await createEventForm({ netid, name, eventType, startDate, endDate, organizationName, location, about });

    // Broadcast a notification to the admin room that the event form has been created
    const io = req.app.get("io");
    io.to("admin").emit("eventForm:new", {message: "Event request submitted", event: eventForm});

    // Return the event form to the requesting client
    res.status(201).json({ success: true, message: "Your event request has been submitted", data: toPublicEvent(eventForm)});
  } catch (error) {
    console.error("Error creating event form:", error.message);
    res.status(400).json({ success: false, message: "Error submitting event request", error: error.message });
  }
});

// Get all event forms
router.get("/events/", async (req, res) => {
  try {
    const eventForms = await getAllEventForms();
    res.status(200).json({ success: true, message: "All event requests retrieved successfully", data: eventForms.map(toPublicEvent)});
  } catch (error) {
    console.error("Error getting all event forms:", error.message);
    res.status(400).json({ success: false, message: "Error getting all event requests", error: error.message });
  }
});

// Update an event form
// NOTE: Only admins can update event forms
// NOTE: id is the event form's id, stored as the primary key in the database
router.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params; // id is found in the url path
    const { approvalStatus } = req.body;

    // Initalize the io instance
    const io = req.app.get("io");

    // Update the event form in the database
    const eventForm = await updateEventForm({ id: parseInt(id), approvalStatus });
    
    // Handle event approval (currentl assumes that an update is only for approval or rejection, excludes pending)
    if (approvalStatus === "approved") {
      // Send a notification to everyone (and the admin room)
      io.to("public").emit("eventForm:update", {message: "Event approved", event: toPublicEvent(eventForm)});
    } else {
      // Send a notification to the submitting user (and the admin room) that the event was rejected
      io.to(`netid:${eventForm.netid}`).emit("eventForm:update", {message: "Your event request has been rejected", event: toPublicEvent(eventForm)});
    }
    
    // Return the event form to the admin client that requested the update
    res.status(200).json({ success: true, message: "Event request updated successfully", data: eventForm});
  } catch (error) {
    console.error("Error updating event form:", error.message);
    res.status(400).json({ success: false, message: "Error updating event request", error: error.message });
  }
});

// Get all approved event forms
router.get("/events/approved", async (req, res) => {
  try {
    const eventForms = await getApprovedEventForms();
    res.status(200).json({ success: true, message: "All approved event requests retrieved successfully", data: eventForms.map(toPublicEvent)});
  } catch (error) {
    console.error("Error getting all approved event requests:", error.message);
    res.status(400).json({ success: false, message: "Error getting all approved event requests", error: error.message });
  }
});

export default router;