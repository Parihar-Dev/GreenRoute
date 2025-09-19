const axios = require('axios');
const { Trip } = require('../database/index');
const { asyncHandler, sendResponse, createError } = require('../auth/error-handler');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');

const directionsClient = mbxDirections({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });

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

    let mapboxRes;
    try {
        mapboxRes = await directionsClient.getDirections({
            profile: 'driving',
            waypoints: [
                { coordinates: startCoords },
                ...waypoints.map(w => ({ coordinates: w })),
                { coordinates: endCoords }
            ],
            geometries: 'geojson',
            alternatives: false,
            annotations: ['distance', 'duration']
        }).send();
    } catch (error) {
        console.error("Mapbox Directions API Error:", error.body || error.message);
        throw createError(500, "Failed to get route from Mapbox.");
    }

    const route = mapboxRes.body.routes[0];

    if (!route) {
        throw createError(404, "No route found for the given locations.");
    }
    
    const distance_m = route.distance;
    const duration_s = route.duration;
    const distance_km = distance_m / 1000;
    const duration_min = duration_s / 60;
    const decodedPolyline = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

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
        throw createError(500, "Failed to predict energy consumption.");
    }

    const predictedEnergy = mlRes.data.predicted_energy_kwh;
    const finalBatteryLevel = battery_level_percent - (predictedEnergy / vehicle.battery_capacity_kwh) * 100;
    const chargingStopsCount = finalBatteryLevel < 20 ? 1 : 0;

    let chargingStations = [];
    if (chargingStopsCount > 0) {
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

            // Handle case where API returns no stations despite a need for them
            if (chargingStopsCount > 0 && chargingStations.length === 0) {
                chargingStations = [{
                    name: "No charging stops found.",
                    distance: "N/A",
                    type: "N/A",
                    price: "N/A",
                    chargingTime: "N/A",
                    status: "N/A"
                }];
            }
        } catch (error) {
            console.error("OpenChargeMap API Error:", error.response?.data || error.message);
            // Instead of throwing an error, provide a user-friendly message
            chargingStations = [{
                name: "Could not retrieve charging stations.",
                distance: "Please check your OpenChargeMap API key or try again later.",
                type: "N/A",
                price: "N/A",
                chargingTime: "N/A",
                status: "N/A"
            }];
        }
    }

    const responseData = {
        routeSummary: {
            distance: `${distance_km.toFixed(1)} km`,
            duration: `${Math.round(duration_min)} min`,
            energyConsumption: `${predictedEnergy.toFixed(2)} kWh`,
            chargingStops: chargingStopsCount,
            finalBattery: `${finalBatteryLevel.toFixed(1)}%`
        },
        chargingStations,
        routePolyline: decodedPolyline
    };

    await Trip.create({
        startLatitude: start_location.latitude,
        startLongitude: start_location.longitude,
        endLatitude: end_location.latitude,
        endLongitude: end_location.longitude,
        predictedConsumption: predictedEnergy,
        userId: userId
    });

    sendResponse(res, 200, responseData);
});