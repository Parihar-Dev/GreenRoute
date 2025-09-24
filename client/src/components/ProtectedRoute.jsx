import { useSelector } from "react-redux";
import { Navigate, Outlet } from 'react-router-dom';
import Loader from "./Loader";

function ProtectedRoute () {
    const { token, status } = useSelector((state) => state.auth);

    if (status === 'loading') {
        return <Loader />;
    }

    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;