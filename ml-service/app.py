# app.py
"""
FastAPI app that loads models/energy_model.pkl and exposes /predict-energy and /plan-route
"""

import os
import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "energy_model.pkl")

app = FastAPI(title="GreenRoute ML Service")

# Add CORS middleware to allow requests from your Node.js server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you would replace "*" with your frontend's domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model safely
if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"Loaded model from {MODEL_PATH}")
else:
    # Fallback: Dummy model
    class DummyModel:
        def predict(self, X):
            # Simple heuristic: 0.16 kWh per km + small constant
            X = np.array(X)
            distances = X[:, 0]
            return (0.16 * distances) + 0.5

    model = DummyModel()
    print("WARNING: model file not found or empty — using DummyModel. Run train_model.py to create a real model.")

# Request schemas for prediction
class VehicleInfo(BaseModel):
    battery_capacity_kwh: float
    # you can add mass, drag, etc. if available
    vehicle_mass_kg: Optional[float] = None
    drag_coeff: Optional[float] = None
    frontal_area_m2: Optional[float] = None
    rolling_resistance_coeff: Optional[float] = None

class PredictRequest(BaseModel):
    distance_km: float
    elevation_gain_m: float = 0.0
    avg_speed_kmph: float = 50.0
    temperature_c: float = 25.0
    vehicle: VehicleInfo

class PredictResponse(BaseModel):
    predicted_energy_kwh: float

# Request schemas for route planning
class LocationInfo(BaseModel):
    latitude: float
    longitude: float

class PredictRouteRequest(BaseModel):
    start_location: LocationInfo
    end_location: LocationInfo
    battery_level_percent: float
    vehicle: VehicleInfo

@app.post("/predict-energy", response_model=PredictResponse)
def predict_energy(req: PredictRequest):
    # Build feature vector in the same order used during training
    # For any missing vehicle features, use reasonable defaults
    vehicle_mass = req.vehicle.vehicle_mass_kg or 1500.0
    drag_coeff = req.vehicle.drag_coeff or 0.30
    frontal_area = req.vehicle.frontal_area_m2 or 2.4
    rolling_rr = req.vehicle.rolling_resistance_coeff or 0.01

    features = [
        req.distance_km,
        req.elevation_gain_m,
        req.avg_speed_kmph,
        req.temperature_c,
        vehicle_mass,
        drag_coeff,
        frontal_area,
        rolling_rr,
        req.vehicle.battery_capacity_kwh
    ]
    X = np.array([features])
    pred = model.predict(X)[0]
    # Ensure positive
    pred = float(max(0.0, pred))
    return {"predicted_energy_kwh": pred}

@app.post("/plan-route")
def plan_route(req: PredictRouteRequest):
    # This is where your AI-based route planning logic would go.
    # It would call an external service (e.g., Mapbox, Openrouteservice)
    # to get a route and its attributes (distance, elevation, etc.).
    # For now, we'll simulate it.
    
    # 1. Simulate fetching route data
    # In a real app, you would use a mapping API to get these values
    distance = 150.0  # km
    elevation_gain = 350.0  # meters
    avg_speed = 70.0  # kmph
    temperature = 25.0  # Celsius

    # 2. Call the prediction model
    features_for_model = [
        distance,
        elevation_gain,
        avg_speed,
        temperature,
        req.vehicle.vehicle_mass_kg or 1500.0,
        req.vehicle.drag_coeff or 0.30,
        req.vehicle.frontal_area_m2 or 2.4,
        req.vehicle.rolling_resistance_coeff or 0.01,
        req.vehicle.battery_capacity_kwh
    ]
    predicted_energy = model.predict([features_for_model])[0]
    
    # 3. Simulate remaining logic for the response
    final_battery_level = req.battery_level_percent - (predicted_energy / req.vehicle.battery_capacity_kwh) * 100
    charging_stops = 1 if final_battery_level < 20 else 0
    
    # 4. Construct a mock response
    response_data = {
        "routeSummary": {
            "distance": f"{distance:.1f} km",
            "duration": f"{round(distance / avg_speed * 60)} min",
            "energyConsumption": f"{predicted_energy:.2f} kWh",
            "chargingStops": charging_stops,
            "finalBattery": f"{final_battery_level:.1f}%"
        },
        "chargingStations": [
            {
                "name": "Expressway Charge Point",
                "distance": f"{distance/2:.1f} km",
                "type": "DC Fast (120kW)",
                "price": "₹22/kWh",
                "chargingTime": "25 min",
                "status": "Available"
            }
        ] if charging_stops > 0 else []
    }
    
    return response_data
