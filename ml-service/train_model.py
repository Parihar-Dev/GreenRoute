# train_model.py
"""
Generates synthetic EV trip data, trains a regression model to predict energy consumption (kWh),
and saves the trained model to models/energy_model.pkl
"""

import os
import random
import math
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

# ---------------------------------------------------------------------
# Helpers: physics-inspired synthetic energy calculation (very simplified)
# ---------------------------------------------------------------------
def physics_energy_kwh(distance_km, elevation_gain_m, avg_speed_kmph, temperature_c,
                       vehicle_mass_kg, drag_coeff, frontal_area_m2, rolling_resistance_coeff):
    """
    Rough energy estimate (kWh) for synthetic data generation.
    This is a simplified model combining:
      - rolling resistance
      - aerodynamic drag
      - climbing energy
      - accessory/aux losses (temp-dependent)
    Not a real EV model, but good for creating varied training data.
    """
    # Convert
    distance_m = distance_km * 1000.0
    avg_speed_ms = avg_speed_kmph * 1000.0 / 3600.0

    # Constants
    g = 9.80665  # gravity
    air_density = 1.225 * max(0.5, 1 - 0.003 * (temperature_c - 15))  # approximate variation with temp

    # Rolling resistance energy = rolling_coeff * mass * g * distance
    rolling_energy_j = rolling_resistance_coeff * vehicle_mass_kg * g * distance_m

    # Aerodynamic drag energy = 0.5 * rho * Cd * A * v^2 * distance
    aero_energy_j = 0.5 * air_density * drag_coeff * frontal_area_m2 * (avg_speed_ms ** 2) * distance_m

    # Elevation/climb energy = mass * g * elevation_gain
    climb_energy_j = vehicle_mass_kg * g * elevation_gain_m

    # Accessory and inefficiencies (simple): proportional to time and colder temps increase aux load
    time_hours = distance_km / max(1e-3, avg_speed_kmph)
    aux_power_kw = 0.5 + 0.05 * max(0, 20 - temperature_c)  # kW for heating etc (simple)
    aux_energy_j = aux_power_kw * 1000.0 * time_hours * 3600.0

    # Sum energies in Joules
    total_j = rolling_energy_j + aero_energy_j + climb_energy_j + aux_energy_j

    # Convert to kWh (1 kWh = 3.6e6 J); add some drivetrain inefficiency (~85% efficient)
    drivetrain_efficiency = 0.85
    total_kwh = (total_j / 3.6e6) / drivetrain_efficiency

    return total_kwh

# ---------------------------------------------------------------------
# Synthetic dataset generator
# ---------------------------------------------------------------------
def generate_synthetic_dataset(n_samples=5000, random_seed=42):
    random.seed(random_seed)
    np.random.seed(random_seed)

    rows = []
    for _ in range(n_samples):
        # Trip features
        distance_km = np.clip(np.random.exponential(scale=40.0), 1.0, 800.0)  # 1km to 800km
        elevation_gain_m = np.clip(np.random.normal(loc=200.0, scale=300.0), 0.0, 5000.0)
        avg_speed_kmph = np.clip(np.random.normal(loc=60.0, scale=20.0), 10.0, 140.0)
        temperature_c = np.clip(np.random.normal(loc=25.0, scale=8.0), -10.0, 45.0)

        # Vehicle params (you can expand these)
        vehicle_mass_kg = np.random.choice([1200, 1500, 1800, 2100])  # typical passenger car masses
        drag_coeff = np.random.uniform(0.24, 0.36)
        frontal_area_m2 = np.random.uniform(2.0, 2.8)
        rolling_resistance_coeff = np.random.uniform(0.008, 0.013)
        battery_capacity_kwh = np.random.choice([40, 50, 60, 75, 90])

        # Compute synthetic target (with noise)
        base_kwh = physics_energy_kwh(distance_km, elevation_gain_m, avg_speed_kmph, temperature_c,
                                      vehicle_mass_kg, drag_coeff, frontal_area_m2, rolling_resistance_coeff)
        # Add noise and some dependence on battery size (bigger batteries might be in heavier cars)
        noise = np.random.normal(scale=0.05 * base_kwh + 0.2)
        target_kwh = max(0.1, base_kwh + noise)

        rows.append({
            "distance_km": distance_km,
            "elevation_gain_m": elevation_gain_m,
            "avg_speed_kmph": avg_speed_kmph,
            "temperature_c": temperature_c,
            "vehicle_mass_kg": vehicle_mass_kg,
            "drag_coeff": drag_coeff,
            "frontal_area_m2": frontal_area_m2,
            "rolling_resistance_coeff": rolling_resistance_coeff,
            "battery_capacity_kwh": battery_capacity_kwh,
            "energy_kwh": target_kwh
        })

    df = pd.DataFrame(rows)
    return df

# ---------------------------------------------------------------------
# Training pipeline
# ---------------------------------------------------------------------
def train_and_save_model(df, model_path="models/energy_model.pkl"):
    features = [
        "distance_km",
        "elevation_gain_m",
        "avg_speed_kmph",
        "temperature_c",
        "vehicle_mass_kg",
        "drag_coeff",
        "frontal_area_m2",
        "rolling_resistance_coeff",
        "battery_capacity_kwh"
    ]
    X = df[features].values
    y = df["energy_kwh"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    print("Training model...")
    model.fit(X_train, y_train)

    print("Evaluating model...")
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Test MAE: {mae:.3f} kWh, R2: {r2:.3f}")

    # Ensure directory exists
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    print(f"Saved model to {model_path}")
    return model

# ---------------------------------------------------------------------
# Main: generate, train, save, produce a small sample csv
# ---------------------------------------------------------------------
if __name__ == "__main__":
    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset(n_samples=6000)
    # Save sample csv for inspection
    df.sample(10).to_csv("models/sample_data_preview.csv", index=False)
    trained_model = train_and_save_model(df, model_path="models/energy_model.pkl")
