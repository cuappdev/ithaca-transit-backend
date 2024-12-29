import express from 'express';
import LogUtils from '../utils/LogUtils.js';
import RouteUtils from '../utils/RouteUtilsV3.js';
import AnalyticsUtils from '../utils/AnalyticsUtils.js';

const router = express.Router();
//look into caching this or smth
router.post('/route', async (req, res) => {
  try {
    const {
      destinationName,
      end,
      arriveBy,
      originName,
      start,
      time,
      uid,
    } = req.body;

    // Determine if the request is an 'arrive by' query
    const isArriveBy = (arriveBy === '1' || arriveBy === true || arriveBy === 'true' || arriveBy === 'True');

    // Check if the origin is a bus stop
    const isOriginBusStop = await RouteUtils.isBusStop(originName);
    const originBusStopName = isOriginBusStop ? originName : null;

    // Get the sectioned routes
    const sectionedRoutes = await RouteUtils.getSectionedRoutes(
      originName,
      destinationName,
      end,
      start,
      time,
      isArriveBy,
      originBusStopName,
    );

    // Flatten the routes for logging
    const routes = RouteUtils.flatten(Object.values(sectionedRoutes));

    // Log the route request if routes are available
    if (routes.length > 0) {
      const requestLog = {
        isArriveBy,
        destinationName,
        end: routes[0].endCoords,
        originName,
        start: routes[0].startCoords,
        time,
        uid,
      };
      LogUtils.log({ category: 'routeRequest', request: requestLog });
    }
    AnalyticsUtils.assignRouteIdsAndCache(routes);

    // Send the sectioned routes as the response
    res.json(sectionedRoutes);
  } catch (error) {
    LogUtils.logErr(error, req.body, 'Error processing route request');
    res.status(500).json({ error: 'Failed to process the route request' });
  }
});

export default router;
