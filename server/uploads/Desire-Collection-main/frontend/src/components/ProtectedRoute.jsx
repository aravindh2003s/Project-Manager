import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL, getDemoSession } from '../lib/api';
import AuthModal from './AuthModal';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const demoUser = getDemoSession();
    if (demoUser) {
      setIsAuthenticated(true);
      return;
    }

    try {
      await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Navigate to="/" replace />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
          }}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return children;
}

export default ProtectedRoute;
