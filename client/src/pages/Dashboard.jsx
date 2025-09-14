import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/authSlice';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Battery, LogOut, ArrowLeft, Route, Navigation, User, Car, Fuel, CheckCircle, AlertCircle } from 'lucide-react';
import "leaflet/dist/leaflet.css";

const mockDashboardData = {
    routeSummary: {
        distance: '150 km',
        duration: '2h 30m',
        energyConsumption: '25 kWh',
        chargingStops: 0,
        finalBattery: '45%',
    },
    chargingStations: [
        {
            name: 'InstaCharge Expressway',
            distance: '80 km',
            type: 'DC Fast (120kW)',
            price: '₹22/kWh',
            chargingTime: '25 min',
            status: 'Available',
        }
    ],
};

const MOCK_LOCATIONS = {
    'pune': { lat: 18.5204, lng: 73.8567 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
};

const mockGeocode = async (location) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const coordinates = MOCK_LOCATIONS[location.toLowerCase().trim()];
            if (coordinates) {
                resolve(coordinates);
            } else {
                reject(new Error("Location not found. Try 'Pune', 'Mumbai', 'Delhi', or 'Bangalore'."));
            }
        }, 500);
    });
};

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
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

    const onLogout = () => {
        dispatch(logout());
        setIsDropdownOpen(false);
        navigate('/login');
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

const TripPlannerForm = ({ tripData, onInputChange, onFindRoute, onReset, isLoading, error }) => (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="flex items-center text-white font-medium mb-4">
            <Route className="h-5 w-5 mr-2 text-emerald-400" /> Plan Your Trip
        </h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="start" className="text-sm font-medium text-slate-300">From</label>
                <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        id="start"
                        placeholder="e.g., Pune"
                        value={tripData.startLocation}
                        onChange={(e) => onInputChange('startLocation', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 transition"
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
                        className="w-full pl-10 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 transition"
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
                    className="mt-2 w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-thumb"
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
            {stations.map((station, index) => (
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
            ))}
        </div>
    </div>
);

const MapPanel = ({routeCoordinates}) => {
    return (
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routeCoordinates && (
                <>
                    <Marker position={[routeCoordinates.start.lat, routeCoordinates.start.lng]}>
                        <Popup>Start Point</Popup>
                    </Marker>
                    <Marker position={[routeCoordinates.end.lat, routeCoordinates.end.lng]}>
                        <Popup>Destination</Popup>
                    </Marker>
                </>
            )}
        </MapContainer>
    );
};


function  Dashboard() {
    const [tripData, setTripData] = useState({ startLocation: '', destination: '', batteryPercentage: 75 });
    const [routeGenerated, setRouteGenerated] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = useCallback((field, value) => {
        setTripData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    }, [error]);

    const handleFindRoute = useCallback(async () => {
        if (!tripData.startLocation || !tripData.destination) {
            setError('Please enter both start and destination locations.');
            return;
        }
        setError('');
        setIsLoading(true);
        setRouteCoordinates(null);
        try {
            const start = await mockGeocode(tripData.startLocation);
            const end = await mockGeocode(tripData.destination);
            setRouteCoordinates({ start, end });
            setRouteGenerated(true);
        } catch (err) {
            setError(err.message);
            setRouteGenerated(false);
        } finally {
            setIsLoading(false);
        }
    }, [tripData]);

    const resetRoute = useCallback(() => {
        setRouteGenerated(false);
        setRouteCoordinates(null);
        setTripData({ startLocation: '', destination: '', batteryPercentage: 75 });
        setError('');
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <DashboardHeader />
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-full sm:w-96 h-[calc(100vh-69px)] bg-slate-900/30 border-r border-slate-800 p-6 overflow-y-auto space-y-6">
                    <TripPlannerForm tripData={tripData} onInputChange={handleInputChange} onFindRoute={handleFindRoute} onReset={routeGenerated ? resetRoute : null} isLoading={isLoading} error={error} />
                    {routeGenerated && (<>
                        <RouteSummary summary={mockDashboardData.routeSummary} />
                        <ChargingStations stations={mockDashboardData.chargingStations} />
                    </>)}
                </aside>
                <main className="flex-1 hidden sm:flex">
                    <MapPanel routeCoordinates={routeCoordinates}/>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;