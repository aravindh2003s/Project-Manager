import { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import axios from 'axios';
import {
  BACKEND_URL,
  findDemoUser,
  getApiErrorMessage,
  saveDemoUser,
  setDemoSession,
} from '../lib/api';

function AuthModal({ isOpen, onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const completeAuth = (user) => {
    setDemoSession(user);
    onSuccess(user);
    onClose();
  };

  const handleDemoAuth = () => {
    if (isLogin) {
      const demoUser = findDemoUser({
        email: formData.email,
        password: formData.password,
      });

      if (!demoUser) {
        setError('No demo account found. Create a new account first.');
        return;
      }

      completeAuth(demoUser);
      return;
    }

    try {
      const demoUser = saveDemoUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      completeAuth(demoUser);
    } catch (demoError) {
      setError(demoError.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        onSuccess(response.data.user);
        onClose();
      }
    } catch (err) {
      if (err?.message === 'Network Error' || !err?.response) {
        handleDemoAuth();
      } else {
        setError(getApiErrorMessage(err, 'Authentication failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-8 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded-xl p-3 mb-4 text-sm" data-testid="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  data-testid="auth-name-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                data-testid="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Password"
                data-testid="auth-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-indigo-600 text-white px-8 py-3 font-bold shadow-lg hover:scale-105 hover:shadow-indigo-500/30 transition-all duration-300"
            data-testid="auth-submit-button"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', name: '' });
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
            data-testid="auth-toggle-button"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
