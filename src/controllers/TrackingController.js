import express from 'express';
import RealtimeFeedUtilsV3 from '../utils/RealtimeFeedUtilsV3.js';

const router = express.Router();

router.post('/tracking/', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        case: 'invalidRequest',
      });
    }

    const trackingResponse = await RealtimeFeedUtilsV3.getTrackingResponse(data);

    res.status(200).json(trackingResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
