import { useSelector } from "react-redux";
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute () {
    const { token, status } = useSelector((state) => state.auth);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <p className="text-white">Loading...</p>
            </div>
        );
    }

    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;