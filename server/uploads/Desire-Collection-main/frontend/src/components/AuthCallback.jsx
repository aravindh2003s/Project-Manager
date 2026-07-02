import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';


function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          navigate('/login', { replace: true });
          return;
        }
        
        // Exchange session_id for user data
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );
        
        if (response.data.success) {
          // Redirect to customize page with user data
          navigate('/customize', { replace: true, state: { user: response.data.user } });
        } else {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/', { replace: true });
      }
    };
    
    processSession();
  }, [navigate, location]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;

