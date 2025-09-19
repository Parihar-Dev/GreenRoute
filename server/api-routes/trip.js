const express = require('express');
const router = express.Router();
const auth = require('../auth/jwt-auth');
const { getTrips, getTripDetails, planTrip } = require('../api/trip');

router.use(auth);

router.get('/', getTrips);
router.get('/:id', getTripDetails);
router.post('/plan', planTrip);

module.exports = router;