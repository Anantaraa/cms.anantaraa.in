import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireAuth({ children }) {
    const { session } = useAuth();
    const location = useLocation();

    if (!session) {
        // Redirect to login page, but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
