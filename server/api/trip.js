const axios = require('axios');
const { Trip } = require('../database/index');
const { asyncHandler, sendResponse, createError } = require('../auth/error-handler');
const polyline = require('polyline-encoded');

exports.getTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.findAll({ where: { userId: req.user.id } });
    sendResponse(res, 200, trips);
});

exports.getTripDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tripDetails = await Trip.findOne({ where: { id, userId: req.user.id } });

    if (!tripDetails) {
        throw createError(404, "Trip detail not found");
    }

    sendResponse(res, 200, tripDetails);
});

exports.planTrip = asyncHandler(async (req, res) => {
    const { start_location, end_location, battery_level_percent, vehicle } = req.body;
    const userId = req.user.id;

    if (!start_location || !end_location || !battery_level_percent || !vehicle) {
        throw createError(400, "Missing required fields");
    }

    const startCoords = [start_location.longitude, start_location.latitude];
    const endCoords = [end_location.longitude, end_location.latitude];
    const waypoints = [];

    const orsProfile = 'driving-car'; 

    const orsPayload = {
        coordinates: [startCoords, ...waypoints, endCoords],
        options: {
            "avoid_features": ['tollways'],
        }
    };

    let orsRes;
    try {
        orsRes = await axios.post(
            `https://api.openrouteservice.org/v2/directions/${orsProfile}`,
            orsPayload,
            {
                headers: {
                    "Authorization": process.env.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (error) {
        console.error("OpenRouteService API Error:", error.response?.data || error.message);
        throw createError(500, "Failed to get route from OpenRouteService.");
    }

    const routes = orsRes.data.routes;
    let bestRoute = null;
    let bestScore = Infinity;

    for (const route of routes) {
        const distance_km = route.summary.distance / 1000;
        const duration_min = route.summary.duration / 60;
        const encodedPolyline = route.geometry;
        const decodedPolyline = polyline.decode(encodedPolyline);

        // Elevation and weather (reuse your logic, or use defaults for alternatives)
        let elevation_gain_m = 200;
        try {
            const elevationRes = await axios.get(
                `https://api.open-meteo.com/v1/elevation?latitude=${start_location.latitude},${end_location.latitude}&longitude=${start_location.longitude},${end_location.longitude}`
            );
            const elevations = elevationRes.data.elevation;
            if (elevations.length === 2) {
                elevation_gain_m = Math.abs(elevations[1] - elevations[0]) * 1.5;
            }
        } catch (error) {}

        let temperature_c = 25;
        try {
            const weatherRes = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${start_location.latitude}&lon=${start_location.longitude}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
            );
            temperature_c = weatherRes.data.main.temp;
        } catch (error) {}

        // ML prediction
        let mlRes;
        try {
            mlRes = await axios.post("http://localhost:8000/predict-energy", {
                distance_km,
                elevation_gain_m,
                avg_speed_kmph: distance_km / (duration_min / 60),
                temperature_c,
                vehicle: {
                    battery_capacity_kwh: parseFloat(vehicle.battery_capacity_kwh),
                    vehicle_mass_kg: parseFloat(vehicle.vehicle_mass_kg),
                    drag_coeff: parseFloat(vehicle.drag_coeff),
                    frontal_area_m2: parseFloat(vehicle.frontal_area_m2),
                    rolling_resistance_coeff: parseFloat(vehicle.rolling_resistance_coeff)
                }
            });
        } catch (error) {
            continue; // skip this route if ML fails
        }

        const predictedEnergy = mlRes.data.predicted_energy_kwh;
        const finalBatteryLevel = battery_level_percent - (predictedEnergy / vehicle.battery_capacity_kwh) * 100;
        const chargingStopsCount = finalBatteryLevel < 20 ? 1 : 0;

        // Simple scoring: prioritize fewer charging stops, then lower energy, then shorter time
        const score = chargingStopsCount * 1000 + predictedEnergy + duration_min / 60;

        if (score < bestScore) {
            bestScore = score;
            bestRoute = {
                routeSummary: {
                    distance: `${distance_km.toFixed(1)} km`,
                    duration: `${Math.round(duration_min)} min`,
                    energyConsumption: `${predictedEnergy.toFixed(2)} kWh`,
                    chargingStops: chargingStopsCount,
                    finalBattery: `${finalBatteryLevel.toFixed(1)}%`
                },
                decodedPolyline,
                chargingStopsCount,
                predictedEnergy,
                finalBatteryLevel
            };
        }
    }

    let chargingStations = [];
    if (bestRoute.chargingStopsCount > 0) {
        try {
            const ocmRes = await axios.get(
                `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=${start_location.latitude}&longitude=${start_location.longitude}&distance=100&distanceunit=KM&key=${process.env.OPENCHARGEMAP_API_KEY}`
            );
            chargingStations = ocmRes.data.slice(0, 5).map(station => ({
                name: station.AddressInfo.Title,
                distance: `${Math.round(station.AddressInfo.Distance)} km`,
                type: station.Connections.length > 0 ? station.Connections[0].ConnectionType.Title : 'Unknown',
                price: 'N/A',
                chargingTime: 'N/A',
                status: 'Available'
            }));
        } catch (error) {}
    }

    const responseData = {
        routeSummary: bestRoute.routeSummary,
        chargingStations,
        routePolyline: bestRoute.decodedPolyline
    };

    await Trip.create({
        startLatitude: start_location.latitude,
        startLongitude: start_location.longitude,
        endLatitude: end_location.latitude,
        endLongitude: end_location.longitude,
        predictedConsumption: bestRoute.predictedEnergy,
        userId: userId
    });

    sendResponse(res, 200, responseData);
});