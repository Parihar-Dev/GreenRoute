import os
import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "energy_model.pkl")

app = FastAPI(title="GreenRoute ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ML residual model
if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 0:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"Loaded residual model from {MODEL_PATH}")
else:
    class DummyModel:
        def predict(self, X):
            return np.zeros(X.shape[0])
    model = DummyModel()
    print("WARNING: model not found — using DummyModel. Run train_model.py first.")

class PredictRequest(BaseModel):
    distance_km: float
    slope_percent: float = 0.0
    avg_speed_kmph: float = 50.0
    temperature_c: float = 25.0
    vehicle_mass_kg: Optional[float] = 1500.0
    battery_capacity_kwh: Optional[float] = 60.0
    efficiency_factor: Optional[float] = 0.95  # factor to account for drivetrain losses

class PredictResponse(BaseModel):
    predicted_energy_kwh: float

@app.post("/predict-energy", response_model=PredictResponse)
def predict_energy(req: PredictRequest):
    # --- Convert efficiency to km/kWh ---
    efficiency_km_per_kwh = req.efficiency_factor if req.efficiency_factor > 1 else 3.85 * 1.609  # fallback

    # --- Physics-based energy calculation ---
    distance_m = req.distance_km * 1000
    g = 9.81

    # Air drag
    air_density = 1.225
    frontal_area = 2.2
    drag_coeff = 0.3
    speed_mps = req.avg_speed_kmph * 1000 / 3600
    drag_force = 0.5 * air_density * frontal_area * drag_coeff * speed_mps**2

    # Rolling resistance
    rolling_coeff = 0.015
    rolling_force = rolling_coeff * req.vehicle_mass_kg * g

    # Gravity (slope)
    gravity_force = (req.slope_percent / 100) * req.vehicle_mass_kg * g

    # Total physics energy in kWh
    total_energy_j = (drag_force + rolling_force + gravity_force) * distance_m
    physics_energy_kwh = total_energy_j / 3.6e6

    # Scale physics energy by actual vehicle efficiency
    physics_energy_kwh = distance_m / 1000 / efficiency_km_per_kwh  # km / (km/kWh)

    # --- ML features for residual correction ---
    elevation_gain_m = (req.slope_percent / 100) * distance_m
    features = [
        req.distance_km,
        elevation_gain_m,
        req.avg_speed_kmph,
        req.temperature_c,
        req.vehicle_mass_kg,
        speed_mps**2,         # drag effect approx
        req.vehicle_mass_kg,   # rolling effect approx
        1 if req.avg_speed_kmph > 80 else 0,  # is_highway
        1 if req.avg_speed_kmph <= 80 else 0, # is_city
    ]
    X = np.array([features])

    # ML residual correction
    ml_correction = float(model.predict(X)[0]) if hasattr(model, "predict") else 0.0

    # --- Final predicted energy ---
    pred_energy_kwh = max(0.0, physics_energy_kwh + ml_correction)

    # Clip to actual battery capacity
    pred_energy_kwh = min(pred_energy_kwh, req.battery_capacity_kwh)

    # Optional: calculate final battery %
    final_battery_percent = max(0.0, (req.battery_capacity_kwh - pred_energy_kwh) / req.battery_capacity_kwh * 100)

    return {
        "predicted_energy_kwh": round(pred_energy_kwh, 3),
        "final_battery_percent": round(final_battery_percent, 1)
    }
