import express from 'express';
import RouteReportingUtils from '../utils/RouteReportingUtils';

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

export default router;