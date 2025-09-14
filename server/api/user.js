const { User, Vehicle } = require('../database/index');
const { asyncHandler, sendResponse, createError } = require('../auth/error-handler');

exports.getProfile = asyncHandler(async(req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name','email']
    });
    if (!user) return sendResponse(res, 404, {
        error: 'User not found'
    });
    sendResponse(res, 200, user);
});

exports.addVehicle = asyncHandler(async(req, res) => {
    const { make, model, batteryCapacity, efficiency } = req.body;
    const userId = req.user.id;

    const existingVehicle = await Vehicle.findOne({
        where: {
            userId: userId,
            make: make,
            model: model
        }
    });

    if (existingVehicle) {
        throw createError(409, `You have already added a ${make} ${model} to your garage`);
    }

    const vehicle = await Vehicle.create({
        make,
        model,
        batteryCapacity,
        efficiency,
        userId
    });

    sendResponse(res, 201, {
        vehicle
    });
});

exports.getVehicles = asyncHandler(async(req, res) => {
    const vehicles = await Vehicle.findAll({ where: { userId: req.user.id }});
    sendResponse(res, 200, vehicles);
});

exports.updateVehicle = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { make, model, batteryCapacity, efficiency } = req.body;

    const vehicle = await Vehicle.findOne({ where: { id, userId: req.user.id }});
    if (!vehicle) {
        throw createError(404, 'Vehicle not found or you do not have permission to edit it');
    }

    await vehicle.update({ make, model, batteryCapacity, efficiency });
    sendResponse(res, 200, vehicle);
});

exports.deleteVehicle = asyncHandler(async(req, res) => {
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({ where: {id, userId: req.user.id }});
    if (!vehicle) {
        throw createError(404, 'Vehicle not found or you do not have permission to delete it');
    }

    await vehicle.destroy();
    sendResponse(res, 200, { message: 'Vehicle deleted successfully.' });
});