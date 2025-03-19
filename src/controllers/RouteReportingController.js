import express from 'express';
import LogUtils from '../utils/LogUtils.js';
import RouteReportingUtils from '../utils/RouteReportingUtils.js';

const router = express.Router();

router.get('/closestBus', async (req, res) => {
  try {
    const {
      routeId,
      start
    } = req.body;

    const closestBus = await RouteReportingUtils.getClosestBus(routeId, start);
    res.status(200).json(closestBus);
  } catch (error) {
    LogUtils.logErr(error, req.body, 'Error fetching closest bus');
    res.status(500).json({ error: 'Failed to fetch closest bus' });
  }
});

router.post('/reports', async (req, res) => {
  try {
    const {
      vehicleId,
      routeId,
      reportText,
      deviceToken,
      timestamp
    } = req.body;

    const report = await RouteReportingUtils.insertReport(vehicleId, routeId, reportText, deviceToken, timestamp);
    res.status(200).json(report);
  } catch (error) {
    LogUtils.logErr(error, req.body, 'Error inserting report');
    res.status(500).json({ error: 'Failed to insert report' });
  }
});

router.get('/reports/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const reports = await RouteReportingUtils.fetchReportsByBus(vehicleId);
    res.status(200).json(reports);
  } catch (error) {
    LogUtils.logErr(error, req.params, 'Error fetching reports by vehicleId');
    res.status(500).json({ error: 'Failed to fetch reports by vehicleId' });
  }
});

export default router;