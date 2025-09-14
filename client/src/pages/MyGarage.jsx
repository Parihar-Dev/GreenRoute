import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getVehicles, addVehicle, deleteVehicle, updateVehicle } from '../features/vehicleSlice';
import { logout } from '../features/authSlice';
import { Car, BatteryCharging, Zap, Trash2, Plus, Loader2, X, ArrowLeft, User, LogOut, Edit } from 'lucide-react';

// Reusable hook to detect clicks outside of a component
const useOnClickOutside = (ref, handler) => {
    useEffect(() => {
        const listner = (event) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event)
        };
        document.addEventListener('mousedown', listner);
        document.addEventListener('touchstart', listner);
        return () => {
            document.removeEventListener('mousedown', listner);
            document.removeEventListener('touchstart', listner);
        };
    }, [ref, handler]);
}

// Modal for adding or updating a vehicle
const AddVehicleModal = ({ isOpen, onClose, onError, vehicle }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ make: '', model: '', batteryCapacity: '', efficiency: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        if (error) setError(null);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Resets form data when modal opens for a new vehicle or when a vehicle is selected for edit
    useEffect(() => {
        if (vehicle) {
            setFormData(vehicle);
        } else {
            setFormData({ make: '', model: '', batteryCapacity: '', efficiency: '' });
        }
    }, [vehicle, isOpen])

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        
        try {
            let resultAction;
            if (vehicle) {
                resultAction = await dispatch(updateVehicle({ id: vehicle.id, updatedData: formData }));
            } else {
                resultAction = await dispatch(addVehicle(formData));
            }
            
            if (resultAction.meta.requestStatus === 'fulfilled') {
                onClose();
            } else {
                const errorMessage = resultAction.payload?.message || (vehicle ? 'Failed to update vehicle' : 'Failed to add vehicle.');
                setError(errorMessage);
                if (onError) onError(errorMessage);
            }
        } catch (err) {
            const errorMessage = err.message || 'An unexpected error occurred.';
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900/50 text-white p-6 rounded-lg shadow-2xl w-full max-w-md relative animate-fade-in-up border border-slate-700">
                <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className='flex justify-between items-center'>
                        <h2 className="text-xl font-normal">{ vehicle ? 'Update Vehicle' : 'Add New Vehicle'}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X /></button>
                    </div>
                    {error && <p className="text-red-400 text-sm bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    <div className="grid grid-cols-1 gap-4 pt-4">
                        <input
                            name="make"
                            type="text"
                            placeholder="Make (e.g., Tata)"
                            value={formData.make}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 font-light placeholder-slate-400 text-white border border-slate-700 rounded-md bg-slate-800/50 focus:outline-none focus:border-[#78E65A]"
                            required
                        />
                        <input
                            name="model"
                            type="text"
                            placeholder="Model (e.g., Nexon EV)"
                            value={formData.model}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 font-light placeholder-slate-400 text-white border border-slate-700 rounded-md bg-slate-800/50 focus:outline-none focus:border-[#78E65A]"
                            required
                        />
                        <input
                            name="batteryCapacity"
                            type="number"
                            placeholder="Battery (kWh)"
                            value={formData.batteryCapacity}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 font-light placeholder-slate-400 text-white border border-slate-700 rounded-md bg-slate-800/50 focus:outline-none focus:border-[#78E65A]"
                            required
                            min="0"
                        />
                        <input
                            name="efficiency"
                            type="text"
                            placeholder="Efficiency (mi/kWh)"
                            value={formData.efficiency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 font-light placeholder-slate-400 text-white border border-slate-700 rounded-md bg-slate-800/50 focus:outline-none focus:border-[#78E65A]"
                            required
                            min="0"
                        />
                    </div>
                    <button type="submit" className="w-full bg-[#00E676] text-black font-normal py-3 rounded-lg hover:bg-green-400 transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={isSubmitting}>
                        {isSubmitting 
                        ? <><Loader2 size={20} className="animate-spin" /><span>{vehicle ? 'Updating...' : 'Adding...'}</span></> 
                        : <><Plus size={20} /><span>{ vehicle ? 'Update Vehicle' : 'Add Vehicle'}</span></>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

// Component to display each vehicle as a card
const VehicleCard = ({ vehicle, onDelete, onEdit }) => {
    const logoUrl = `https://logo.clearbit.com/${vehicle.make.toLowerCase().replace(/\s+/g, '')}.com`;
    const fallbackImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjYWQxZGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj09InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jYXIiPjxwYXRoIGQ9Ik03IDE1aDFhMSAwIDAgMCAuOTQtLjU2TDEwIDEwbDIgNWgxdjBBNCA0IDAgMCAwIDkuODYgMTVIMTRhMSAwIDAgMCAxLTFhNiAxIDAgMCAwIDEtMVY5aC0xYTIgMiAwIDAgMC0yLTJIN2EyIDIgMCAwIDAtMiAyelpvIjwvPjwvPjwvPjwvPjwvPjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2FkMWRlIiBzdHJva2U9IiMxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2FyIj48cGF0aCBkPSJNNyAxNWgxYTEgMCAwIDAgLjk0LS41NkwxMCAxMGwyIDVoMWExIDAgMCAwIC45NC0uNTZMMTExMHhNMjIuMjI1IDBoLTIwLjQ1Yy0uOTc5IDAtMS43NzEuNzc0LTEuNzc1IDEuNzI5di4wMDF2MjAuNTQyYy4wMDMgLjk1NC43OTUgMS43MjkgMS43NzUgMS43MjloMjAuNDUxYy45NzkgMCAxLjc3MS0uNzc0IDEuNzc1LTEuNzI5di0yMC41NDJjLS4wMDQtLjk1NC0uNzk2LTEuNzI4LTEuNzc1LTEuNzI4em0tNC44NjUgMjAuNDUyYzAgMCAwIDAgLTguOTg0LS4wMDMtMTcuMzI5VjhoMy41NjR2MTEuNDUyem0xMi42MS00LjEyN2gtMy41NTR2LTUuNTY5Yy0uMDAxLTEuMzI4LS4wMjgtMy4wMzctMS44NTMtMy4wMzctMS44NTMgMC0yLjEzNiAxLjQ0NS0yLjEzNiAyLjkzOXY1LjY2N2gtMy41NjR2LTExLjQ1MmgtMy4zMTJjLS45NDYgMC0xLjcyOS0uNzgzLTEuNzI5LTEuNzU0IDAtLjk3MS43ODMtMS43MjkgMS43MjktMS43MjlsLS4wMDQtLjAwMWwxLjgzNy0uMDA0aDEwLjEwMXYxLjU2MWguMDQ2Yy40NzctLjkgMS42MzctMS44NSAzLjM3LTEuODUgMy42MDEgMCA0LjI2NyAyLjM3IDQuMjY3IDUuNDU1djYuMjg2em0tMi4wNjMtMTMuMDM5Yy0xLjE0NCAwLTIuMDYzLS45MjYtMi4wNjMtMi4wNjUgMC0xLjEzOC45MjUtMi4wNjMgMi4wNjMtMi4wNjMgMS4xNCAwIDIuMDY0LjkyNSAyLjA2NCAyLjA2MyAwIDEuMTM5LS45MjUgMi4wNjUtMi4wNjQgMi4wNjV6Ii8+PGNpcmNsZSBjeD0iNi41IiBjeT0iMTUiIHI9Ii41Ii8+PGNpcmNsZSBjeD0iMTcuNSIgY3k9IjE1IiByPSIuNSIvPjwvc3ZnPg==";

    return (
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-xl transition-all duration-300 hover:bg-slate-800/70 hover:scale-105 backdrop-blur-sm group">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-slate-700/50 rounded-lg">
                    <img
                        src={logoUrl}
                        alt={`${vehicle.make} logo`}
                        onError={(e) => { e.currentTarget.src = fallbackImage }}
                        className='h-12 w-auto object-contain rounded-md'
                    />
                </div>
                <div>
                    <p className="text-sm text-slate-400 font-light">{vehicle.make}</p>
                    <h3 className="font-normal text-xl text-white">{vehicle.model}</h3>
                </div>
            </div>
            <div className="flex gap-4 border-t border-slate-700 mt-4 pt-4 text-sm text-slate-400 font-light mb-4">
                <p className="flex items-center"><BatteryCharging size={16} className="mr-2 text-emerald-400" />{vehicle.batteryCapacity} kWh</p>
                <p className="flex items-center"><Zap size={16} className="mr-2 text-emerald-400" />{vehicle.efficiency} mi/Kwh</p>
            </div>
            <div className='flex items-center gap-4'>
                <div onClick={() => onEdit(vehicle)} className="text-slate-400 transition-colors cursor-pointer">
                    <div className='px-2 py-1 flex justify-center items-center gap-2 border border-slate-400 rounded-md'>
                        <Edit size={14} />
                        <p>Edit</p>
                    </div>
                </div>
                <div onClick={() => onDelete(vehicle.id)} className="text-red-400 transition-colors cursor-pointer">
                    <div className='px-2 py-1 flex justify-center items-center gap-2 border border-red-400 rounded-md'>
                        <Trash2 size={14} />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Header for the MyGarage and Dashboard pages
const DashboardHeader = () => {
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
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

function MyGarage() {
    const dispatch = useDispatch();
    const { items: vehicles, status } = useSelector((state) => state.vehicles);
    const [ isAddModalOpen, setIsAddModalOpen ] = useState(false);
    const [ vehicleData, setVehicleData ] = useState(null);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(getVehicles());
        }
    }, [status, dispatch]);

    const handleDelete = (id) => {
        dispatch(deleteVehicle(id));
    };

    const handleUpdate = (vehicle) => {
        setVehicleData(vehicle);
        setIsAddModalOpen(true);
    }

    return (
        <>
            <main className="bg-slate-950 text-white min-h-screen">
                <DashboardHeader />
                <AddVehicleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} vehicle={vehicleData} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <header className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-normal text-white">My Garage</h1>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-400 text-black font-semibold px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors cursor-pointer">
                            <Plus size={20} />
                            <span>Add Vehicle</span>
                        </button>
                    </header>
                    {status === 'loading' && <p className="text-center text-slate-400">Loading vehicles...</p>}
                    {status !== 'loading' && vehicles.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
                            <Car size={48} className="mx-auto text-slate-600" />
                            <h3 className="mt-2 text-xl font-normal text-white">Your garage is empty</h3>
                            <p className="mt-1 text-slate-400 font-light">Get started by adding your first vehicle.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map(vehicle => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={handleDelete} onEdit={handleUpdate} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
};

export default MyGarage;