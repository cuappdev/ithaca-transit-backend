import express from "express";
import SearchUtils from "../utils/SearchUtils.js";

const router = express.Router();

router.post("/applePlaces/", async (req, res) => {
  try {
    const { query, places } = req.body;

    if (
      !query ||
      typeof query !== "string" ||
      !places ||
      !Array.isArray(places)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid request body. "query" must be a string and "places" must be an array.',
      });
    }

    SearchUtils.updateCachedPredictionsForQuery(query.toLowerCase(), places);

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/appleSearch/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body. "query" must be a string.',
      });
    }

    const lowercaseQuery = query.toLowerCase();
    const cachedValue =
      SearchUtils.getCachedPredictionsForQuery(lowercaseQuery);
    const formattedStops = await SearchUtils.getFormattedStopsForQuery(
      lowercaseQuery
    );

    return res.status(200).json({
      success: true,
      data: {
        applePlaces: cachedValue,
        busStops: formattedStops,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// //I'm unsure if this route is used
// const GOOGLE_PLACE = 'googlePlace';
// const GOOGLE_PLACE_LOCATION = '42.4440,-76.5019';

// router.post('/search/', async (req, res) => {
//   try {
//     const { query } = req.body;

//     if (!query || typeof query !== 'string') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid request. "query" must be a non-empty string.',
//       });
//     }

//     const lowercaseQuery = query.toLowerCase();
//     const cachedValue = SearchUtils.queryToPredictionsCache.get(lowercaseQuery);

//     const formattedStops = await SearchUtils.getFormattedStopsForQuery(lowercaseQuery);

//     // If cached value exists, combine and return
//     if (cachedValue) {
//       return res.status(200).json({
//         success: true,
//         data: cachedValue.concat(formattedStops),
//       });
//     }

//     // If not in cache, fetch from Google Places API
//     const options = {
//       ...Constants.GET_OPTIONS,
//       url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
//       qs: {
//         input: lowercaseQuery,
//         key: process.env.PLACES_KEY,
//         location: GOOGLE_PLACE_LOCATION,
//         radius: 24140,
//         strictbounds: '',
//       },
//     };

//     const autocompleteRequest = await RequestUtils.createRequest(options, 'Autocomplete request failed');

//     if (autocompleteRequest) {
//       const autocompleteResult = JSON.parse(autocompleteRequest);

//       const { predictions } = autocompleteResult;

//       const googlePredictions = await Promise.all(
//         predictions.map(async (p) => {
//           const placeIDCoords = await SearchUtils.getCoordsForPlaceID(p.place_id);
//           return {
//             type: GOOGLE_PLACE,
//             detail: p.structured_formatting.secondary_text,
//             name: p.structured_formatting.main_text,
//             placeID: p.place_id,
//             lat: placeIDCoords.lat,
//             long: placeIDCoords.long,
//           };
//         })
//       );

//       if (googlePredictions) {
//         const filteredPredictions = getFilteredPredictions(googlePredictions, formattedStops);
//         SearchUtils.queryToPredictionsCache.set(lowercaseQuery, filteredPredictions);
//         return res.status(200).json({
//           success: true,
//           data: filteredPredictions.concat(formattedStops),
//         });
//       }
//     }

//     res.status(200).json({
//       success: true,
//       data: formattedStops,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// /**
//  * Returns an array of googlePredictions that are not bus stops.
//  * @param {Array<Object>} googlePredictions
//  * @param {Array<Object>} busStops
//  * @returns {Array<Object>}
//  */
// function getFilteredPredictions(googlePredictions, busStops) {
//   return googlePredictions.filter((p) => {
//     const stopsThatArePlaces = busStops.find((s) => p.name.includes(s.name));
//     return stopsThatArePlaces === undefined;
//   });
// }

export default router;
