const express = require('express');
const router = express.Router();
const auth = require('../auth/jwt-auth');
const { getProfile, addVehicle, getVehicles, updateVehicle, deleteVehicle } = require('../api/user');

router.use(auth);

router.get('/profile', getProfile);
router.get('/vehicles', getVehicles);
router.post('/vehicles', addVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);

module.exports = router;