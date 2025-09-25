import axios from 'axios';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { getVehicles } from '../features/vehicleSlice';
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import { MapPin, Battery, LogOut, ArrowLeft, Route, Navigation, User, Car, Fuel, CheckCircle, AlertCircle } from 'lucide-react';
import "mapbox-gl/dist/mapbox-gl.css";
import apiClient from '../api/apiClient';

// Reusable hook to detect clicks outside of a component
const useOnClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const DashboardHeader = () => {
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

    const onLogout = () => {
        dispatch(logout());
        setIsDropdownOpen(false);
        navigate('/');
    }

    return (
        <header className="bg-slate-950/50 backdrop-blur-md border-b border-slate-800 px-6 py-4 z-1001">
            <div className="flex items-center justify-between">
                <a href="/" className="flex text-slate-400 hover:text-emerald-400 transition-colors">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Back to Home
                </a>
                <div className="flex space-x-4">
                    <div className="hidden sm:flex items-center space-x-2 text-slate-300">
                        <Battery className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm">Vehicle Connected</span>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(open => !open)} className="bg-slate-800/50 p-2 rounded-full text-white hover:bg-slate-700 transition-colors cursor-pointer">
                            <User size={20} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-2 border border-slate-700 z-50">
                                <a href="/garage" className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/80 transition-colors">
                                    <Car size={16} /> My Garage
                                </a>
                                <button onClick={onLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/80 transition-colors">
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const TripPlannerForm = ({ tripData, vehicles, onInputChange, onFindRoute, onReset, isLoading, error }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="flex items-center text-white font-medium mb-4">
            <Route className="h-5 w-5 mr-2 text-emerald-400" /> Plan Your Trip
        </h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="vehicle" className="text-sm font-medium text-slate-300">Select Vehicle</label>
                <select
                    id="vehicleId"
                    name="vehicleId"
                    value={tripData.vehicleId}
                    onChange={(e) => onInputChange('vehicleId', e.target.value)}
                    className="w-full pl-3 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 transition focus:outline-none focus:border-emerald-400"
                >
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.make} {v.model}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="start" className="text-sm font-medium text-slate-300">From</label>
                <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        id="start"
                        placeholder="e.g., Pune"
                        value={tripData.startLocation}
                        onChange={(e) => onInputChange('startLocation', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 transition focus:outline-none focus:border-emerald-400"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="destination" className="text-sm font-medium text-slate-300">To</label>
                <div className="relative mt-1">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        id="destination"
                        placeholder="e.g., Mumbai"
                        value={tripData.destination}
                        onChange={(e) => onInputChange('destination', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 transition focus:outline-none focus:border-emerald-400"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="battery" className="text-sm font-medium text-slate-300">Current Battery: {tripData.batteryPercentage}%</label>
                <input
                    id="battery"
                    type="range"
                    min="0"
                    max="100"
                    value={tripData.batteryPercentage}
                    onChange={(e) => onInputChange('batteryPercentage', parseInt(e.target.value))}
                    className="mt-2 w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb focus:outline-none focus:border-emerald-400"
                />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex flex-col space-y-2 pt-2">
                <button onClick={onFindRoute} disabled={isLoading} className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition disabled:bg-emerald-800 disabled:cursor-not-allowed">
                    {isLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Finding Route...</> : <><Navigation className="h-4 w-4 mr-2" />Find Optimal Route</>}
                </button>
                {onReset && <button onClick={onReset} className="w-full px-4 py-2 border border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold rounded-md transition">Plan New Route</button>}
            </div>
        </div>
    </div>
);

const RouteSummary = ({ summary }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-white font-medium mb-4">Route Summary</h3>
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-400">{summary.distance}</div>
                    <div className="text-xs text-slate-400">Total Distance</div>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{summary.duration}</div>
                    <div className="text-xs text-slate-400">Est. Time</div>
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-300">Energy Consumption</span>
                    <span className="text-white font-medium">{summary.energyConsumption}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-300">Charging Stops</span>
                    <span className="text-white font-medium">{summary.chargingStops}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-300">Final Battery</span>
                    <span className="text-emerald-400 font-medium">{summary.finalBattery}</span>
                </div>
            </div>
        </div>
    </div>
);

const ChargingStations = ({ stations }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="flex items-center text-white font-medium mb-4">
            <Fuel className="h-5 w-5 mr-2 text-amber-400" /> Charging Stops
        </h3>
        <div className="space-y-3">
            {stations.length > 0 ? (
                stations.map((station, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{station.name}</h4>
                            <div className={`flex items-center text-xs px-2 py-1 rounded-full ${station.status === 'Available' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
                                {station.status === 'Available' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                {station.status}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <span>Distance: {station.distance}</span>
                            <span>Type: {station.type}</span>
                            <span>Price: {station.price}</span>
                            <span>Time: {station.chargingTime}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-slate-400">No charging stops required.</div>
            )}
        </div>
    </div>
);

const MapPanel = ({ routeCoordinates, routePolyline, isVisible }) => {
    const mapRef = useRef(null);
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const initialViewState = {
        longitude: 78.9629,
        latitude: 20.5937,
        zoom: 5
    };

    const routeGeoJSON = routePolyline ? {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: routePolyline.map(coords => [coords[1], coords[0]])
        }
    } : null;

    const layerStyle = {
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#00E676',
            'line-width': 4
        }
    };

    useEffect(() => {
        if (isVisible && mapRef.current) {
            setTimeout(() => {
                mapRef.current.getMap().resize();
            }, 0);
        }
    },[isVisible])

    useEffect(() => {
        if (routeCoordinates && mapRef.current) {
            const startCoords = [routeCoordinates.start.longitude, routeCoordinates.start.latitude];
            const endCoords = [routeCoordinates.end.longitude, routeCoordinates.end.latitude];
            const bounds = [startCoords, endCoords];
            mapRef.current.fitBounds(bounds, { padding: 50 });
        }
    }, [routeCoordinates]);

    return (
        <div className='w-full h-full relative'>
            <Map
                ref={mapRef}
                mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                initialViewState={initialViewState}
                mapStyle="mapbox://styles/mapbox/streets-v12"
            >
                {routeCoordinates && (
                    <>
                        <Marker longitude={routeCoordinates.start.longitude} latitude={routeCoordinates.start.latitude} anchor="bottom">
                            <MapPin className="h-8 w-8 text-red-500" />
                        </Marker>
                        <Marker longitude={routeCoordinates.end.longitude} latitude={routeCoordinates.end.latitude} anchor="bottom">
                            <MapPin className="h-8 w-8 text-blue-500" />
                        </Marker>
                    </>
                )}
                {routeGeoJSON && (
                    <Source id="route-source" type="geojson" data={routeGeoJSON}>
                        <Layer {...layerStyle} />
                    </Source>
                )}
            </Map>
        </div>
    );
};

function Dashboard() {
    const { items: vehicles, status: vehicleStatus } = useSelector((state) => state.vehicles);
    const [tripData, setTripData] = useState({ startLocation: '', destination: '', batteryPercentage: 75, vehicleId: '' });
    const [routeGenerated, setRouteGenerated] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState(null);
    const [routePolyline, setRoutePolyline] = useState(null);
    const [routeSummary, setRouteSummary] = useState(null);
    const [chargingStations, setChargingStations] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMobileMapVisible, setIsMobileMapVisible] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (vehicleStatus === 'idle') {
            dispatch(getVehicles());
        }
    }, [vehicleStatus, dispatch]);

    useEffect(() => {
        if (vehicles.length > 0 && !tripData.vehicleId) {
            setTripData(prev => ({ ...prev, vehicleId: vehicles[0].id }));
        }
    }, [vehicles, tripData.vehicleId]);

    const handleInputChange = useCallback((field, value) => {
        setTripData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    }, [error]);

    const getGeoCoordinates = async (location) => {
        try {
            const response = await axios.get('https://api.openrouteservice.org/geocode/search', {
                params: {
                    api_key: import.meta.env.VITE_ORS_API_KEY,
                    text: location
                }
            })
            const firstResult = response.data.features[0];
            if (firstResult) {
                return {
                    latitude: firstResult.geometry.coordinates[1],
                    longitude: firstResult.geometry.coordinates[0]
                };
            } else {
                throw new Error('Location not found');
            }
        } catch (error) {
            console.error("Geocoding API Error:", error.response?.data || error.message);
            throw new Error('Failed to fetch coordinates for the location.');
        }
    }

    const handleFindRoute = useCallback(async () => {
        if (!tripData.startLocation || !tripData.destination || !tripData.vehicleId) {
            setError('Please enter a start location, destination, and select a vehicle.');
            return;
        }
        setError('');
        setIsLoading(true);
        setRouteGenerated(false);

        const selectedVehicle = vehicles.find(v => v.id == tripData.vehicleId);

        if (!selectedVehicle) {
            setError('Please select a valid vehicle from your garage.');
            setIsLoading(false);
            return;
        }

        try {
            const startLoc = await getGeoCoordinates(tripData.startLocation);
            const endLoc = await getGeoCoordinates(tripData.destination);

            if (!startLoc || !endLoc) {
                setError("Please use a supported city for now: 'Pune', 'Mumbai', 'Delhi', or 'Bangalore'.");
                setIsLoading(false);
                return;
            }

            const payload = {
                start_location: { latitude: startLoc.latitude, longitude: startLoc.longitude },
                end_location: { latitude: endLoc.latitude, longitude: endLoc.longitude },
                battery_level_percent: tripData.batteryPercentage,
                vehicle: {
                    battery_capacity_kwh: parseFloat(selectedVehicle.batteryCapacity),
                    vehicle_mass_kg: parseFloat(selectedVehicle.mass) || 1800,
                    drag_coeff: parseFloat(selectedVehicle.drag) || 0.28,
                    frontal_area_m2: parseFloat(selectedVehicle.frontalArea) || 2.2,
                    rolling_resistance_coeff: parseFloat(selectedVehicle.rollingResistance) || 0.01
                }
            };

            const response = await apiClient.post('/trip/plan', payload);
            const { routeSummary, chargingStations, routePolyline } = response.data;

            setRouteSummary(routeSummary);
            setChargingStations(chargingStations);
            setRoutePolyline(routePolyline);
            setRouteCoordinates({
                start: { latitude: startLoc.latitude, longitude: startLoc.longitude },
                end: { latitude: endLoc.latitude, longitude: endLoc.longitude }
            });
            setRouteGenerated(true);
            setIsMobileMapVisible(true);
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred while planning the route.');
            setRouteGenerated(false);
            setIsMobileMapVisible(false);
        } finally {
            setIsLoading(false);
        }
    }, [tripData, vehicles]);

    const resetRoute = useCallback(() => {
        setRouteGenerated(false);
        setRouteCoordinates(null);
        setRoutePolyline(null);
        setRouteSummary(null);
        setChargingStations(null);
        setTripData(prev => ({ ...prev, startLocation: '', destination: '' }));
        setError('');
        setIsMobileMapVisible(false);
    }, [tripData]);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <DashboardHeader />
            <div className="flex flex-1 overflow-hidden">
                <aside className={`w-full sm:w-96 h-[calc(100vh-69px)] bg-slate-900/30 border-r border-slate-800 p-6 overflow-y-auto space-y-6 flex-shrink-0 ${isMobileMapVisible ? 'hidden' : ''} sm:block`}>
                    <TripPlannerForm
                        tripData={tripData}
                        vehicles={vehicles}
                        onInputChange={handleInputChange}
                        onFindRoute={handleFindRoute}
                        onReset={routeGenerated ? resetRoute : null}
                        isLoading={isLoading}
                        error={error}
                    />
                    {routeGenerated && routeSummary && chargingStations && (<>
                        <RouteSummary summary={routeSummary} />
                        <ChargingStations stations={chargingStations} />
                    </>)}
                    {!isMobileMapVisible && (
                        <div className="fixed bottom-4 right-4 z-20 sm:hidden">
                            <button
                                onClick={() => setIsMobileMapVisible(true)}
                                className="bg-slate-800 text-white p-3 rounded-full shadow-lg"
                                aria-label="View Map"
                            >
                                <MapPin size={20} />
                            </button>
                        </div>
                    )}
                </aside>
                <main className={`flex-1 ${!isMobileMapVisible ? 'hidden' : ''} sm:flex relative`}>
                    <MapPanel 
                        routeCoordinates={routeCoordinates}
                        routePolyline={routePolyline}
                        isVisible={isMobileMapVisible}
                    />
                    {isMobileMapVisible && (
                        <div className="fixed bottom-4 right-4 z-20 sm:hidden">
                            <button
                                onClick={() => setIsMobileMapVisible(false)}
                                className="bg-slate-800 text-white p-3 rounded-full shadow-lg"
                                aria-label="View Details"
                            >
                                <Route size={20} />
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;