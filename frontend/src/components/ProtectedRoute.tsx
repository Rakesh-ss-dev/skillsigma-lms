import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/signin" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'student') {
            return <Navigate to="/me" replace />;
        }
        return <Navigate to={`/`} replace />;
    }


    return <Outlet />; // renders nested routes
}
