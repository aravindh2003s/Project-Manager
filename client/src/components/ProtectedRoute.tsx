import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, hydrated } = useAuthStore();

    if (!hydrated) {
        return <div className="auth-loading-screen">Loading workspace...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
