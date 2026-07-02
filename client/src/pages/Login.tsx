import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const navigate = useNavigate();
    const { token, loading, error, login, register, clearError } = useAuthStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (token) navigate('/app');
    }, [token, navigate]);

    useEffect(() => {
        clearError();
    }, [mode, clearError]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (mode === 'login') {
            await login({ email, password });
            navigate('/app');
            return;
        }

        await register({ name, email, password });
        navigate('/app');
    };

    return (
        <div className="login-shell">
            <div className="login-hero">
                <div className="login-badge"><Sparkles size={14} /> Client-ready project operations</div>
                <h1>Nexus Workspace</h1>
                <p>
                    A focused workspace for delivery teams to track projects, organize work,
                    and collaborate with confidence.
                </p>
                <div className="login-hero-points">
                    <div><ShieldCheck size={16} /> Real account sessions</div>
                    <div><ShieldCheck size={16} /> Persistent profile settings</div>
                    <div><ShieldCheck size={16} /> Protected project workspace</div>
                </div>
            </div>

            <div className="card login-card">
                <div className="login-card-header">
                    <h2 className="login-title">{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace account'}</h2>
                    <p className="login-subtitle">
                        {mode === 'login' ? 'Use your account to access projects and settings.' : 'Create an account to start managing projects in Nexus.'}
                    </p>
                </div>

                <div className="login-switch">
                    <button type="button" className={`login-switch-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
                        Sign In
                    </button>
                    <button type="button" className={`login-switch-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
                        Create Account
                    </button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div>
                            <label className="login-label" htmlFor="nameInput">Full Name</label>
                            <input id="nameInput" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Enter your name" className="login-input" required />
                        </div>
                    )}

                    <div>
                        <label className="login-label" htmlFor="emailInput">Email</label>
                        <input id="emailInput" value={email} onChange={(e) => setEmail(e.target.value)} type="email" title="Email Address" placeholder="Enter your email" className="login-input" required />
                    </div>

                    <div>
                        <label className="login-label" htmlFor="passwordInput">Password</label>
                        <input id="passwordInput" value={password} onChange={(e) => setPassword(e.target.value)} type="password" title="Password" placeholder="Enter your password" className="login-input" required minLength={6} />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="login-footer">
                    <span>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
                    <button type="button" className="login-link-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                        {mode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                </div>

                <Link to="/" className="login-back-link">Back to overview</Link>
            </div>
        </div>
    );
}
