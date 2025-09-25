import pandas as pd
import os
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import numpy as np

# --- Physics-based energy calculation ---
def compute_physics_energy(row):
    g = 9.81  # gravity
    air_density = 1.225  # kg/m^3
    frontal_area = 2.2   # m^2
    drag_coeff = 0.3
    rolling_coeff = 0.015

    # Convert speed to m/s
    speed_mps = row['avg_speed_kmph'] * 1000 / 3600

    # Forces
    drag_force = 0.5 * air_density * frontal_area * drag_coeff * speed_mps**2
    rolling_force = rolling_coeff * row['vehicle_mass_kg'] * g
    gravity_force = (row['Slope_%'] / 100) * row['vehicle_mass_kg'] * g

    # Total energy in kWh
    distance_m = row['distance_km'] * 1000
    total_energy_j = (drag_force + rolling_force + gravity_force) * distance_m
    return total_energy_j / 3.6e6  # Convert J -> kWh

def train_and_save_model(df, model_path="models/energy_model.pkl"):
    # --- Rename columns first ---
    column_mapping = {
        'Distance_Travelled_km': 'distance_km',
        'Speed_kmh': 'avg_speed_kmph',
        'Temperature_C': 'temperature_c',
        'Vehicle_Weight_kg': 'vehicle_mass_kg',
        'Energy_Consumption_kWh': 'energy_kwh'
    }
    df.rename(columns=column_mapping, inplace=True)

    # --- Physics-based energy ---
    df['physics_energy_kwh'] = df.apply(compute_physics_energy, axis=1)

    # --- Residual for ML ---
    df['residual_energy_kwh'] = df['energy_kwh'] - df['physics_energy_kwh']

    # --- Features for ML ---
    df['elevation_gain_m'] = (df['Slope_%'] / 100) * (df['distance_km'] * 1000)
    df['drag_effect'] = df['avg_speed_kmph']**2
    df['rolling_effect'] = df['vehicle_mass_kg']
    df['is_highway'] = (df['avg_speed_kmph'] > 80).astype(int)
    df['is_city'] = (df['avg_speed_kmph'] <= 80).astype(int)

    features = [
        "distance_km",
        "elevation_gain_m",
        "avg_speed_kmph",
        "temperature_c",
        "vehicle_mass_kg",
        "drag_effect",
        "rolling_effect",
        "is_highway",
        "is_city"
    ]

    X = df[features].values
    y = df["residual_energy_kwh"].values

    # --- Train/test split ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    # --- Train RandomForest on residuals ---
    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    print("Training residual-correction model...")
    model.fit(X_train, y_train)

    # --- Evaluate ---
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Residual MAE: {mae:.3f} kWh, R2: {r2:.3f}")

    # --- Save model ---
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    print(f"Saved residual model to {model_path}")
    return model

if __name__ == "__main__":
    print("Loading real-world dataset...")
    try:
        df = pd.read_csv("data/EV_Energy_Consumption_Dataset.csv")
    except FileNotFoundError:
        print("Error: Dataset not found. Please place CSV in 'data/' folder.")
        exit()

    train_and_save_model(df, model_path="models/energy_model.pkl")