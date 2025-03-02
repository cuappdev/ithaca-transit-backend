import express from 'express';
import { PYTHON_APP } from '../utils/EnvUtils.js';
import RequestUtils from '../utils/RequestUtils.js';
import NotificationUtils from '../utils/NotificationUtils.js';


const router = express.Router();


router.post('/delayNotification', async (req, res) => {
  try {
    const { deviceToken, tripID, stopID } = req.body;

    // Validate the request body
    if (
      !deviceToken || typeof deviceToken !== 'string' ||
      !stopID || typeof stopID !== 'string' ||
      !tripID || typeof tripID !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Set up the options for the HTTP request
    const options = {
      method: 'POST',
      url: `http://${PYTHON_APP || 'localhost'}:5000/delayNotifs/`,
      body: JSON.stringify({
        tripId: tripID,
        deviceToken,
        stopId: stopID,
      }),
      headers: { 'Content-Type': 'application/json' },
    };

    // Make the request to the microservice
    const delayNotifsRequest = await RequestUtils.createRequest(
      options,
      'delayNotifsRequestFailed',
    );

    // Respond with the result from the microservice
    res.status(200).json({ "sucess": 'successfully sent delay notification' });
  } catch (error) {
    console.error('Error creating delay notification:', error.message);
    res.status(500).json({ error: 'Failed to create delay notification' });
  }
});


// Cancel delay notification
router.post('/cancelDelayNotification', async (req, res) => {
  try {
    const { deviceToken, tripID, stopID } = req.body;

    // Validate request body
    if (
      !deviceToken || typeof deviceToken !== 'string' ||
      !tripID || typeof tripID !== 'string' ||
      !stopID || typeof stopID !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Define the options for the request
    const options = {
      method: 'POST',
      url: `http://${PYTHON_APP || 'localhost'}:5000/deleteDelayNotifs/`,
      body: JSON.stringify({ tripId: tripID, deviceToken, stopId: stopID }),
      headers: { 'Content-Type': 'application/json' },
    };

    // Send the request to the microservice
    const deleteDelayNotifsResponse = await RequestUtils.createRequest(
      options,
      'deleteDelayNotifsRequestFailed'
    );

    res.status(200).json(deleteDelayNotifsResponse);
  } catch (error) {
    console.error('Error canceling delay notification:', error.message);
    res.status(500).json({ error: 'Failed to cancel delay notification' });
  }
});

// Handle departure notifications
router.post('/departureNotification', async (req, res) => {
  try {
    const { deviceToken, startTime } = req.body;

    // Validate request body
    if (
      !deviceToken || typeof deviceToken !== 'string' ||
      !startTime || typeof startTime !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Call the utility function to set up the departure notification
    const result = await NotificationUtils.waitForDeparture(deviceToken, startTime);

    // Respond with the result
    res.status(200).json({ "sucess": 'successfully sent departure notification' });
  } catch (error) {
    console.error('Error setting up departure notification:', error.message);
    res.status(500).json({ error: 'Failed to set up departure notification' });
  }
});


// Cancel departure notification
router.post('/cancelDepartureNotification', async (req, res) => {
  try {
    const { deviceToken, startTime } = req.body;

    // Validate request body
    if (
      !deviceToken || typeof deviceToken !== 'string' ||
      !startTime || typeof startTime !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    // Call the utility function to cancel the departure notification
    const result = await NotificationUtils.cancelDeparture(deviceToken, startTime);

    // Respond with the result
    res.status(200).json({ "sucess": 'successfully canceled departure notification' });
  } catch (error) {
    console.error('Error canceling departure notification:', error.message);
    res.status(500).json({ error: 'Failed to cancel departure notification' });
  }
});



router.post('/microserviceNotif', async (req, res) => {
  try {
    const { deviceToken, routeID } = req.body;

    // Validate the request body
    if (
      !deviceToken || typeof deviceToken !== 'string' ||
      !routeID || typeof routeID !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    const notifData = {
      data: `The bus on ${routeID} is delayed`,
      notification: 'testBody',
    };

    // Send the notification
    const result = await NotificationUtils.sendNotification(deviceToken, notifData);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
