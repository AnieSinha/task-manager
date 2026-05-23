import React, { useState } from 'react';
import { signup, login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const { addToast } = useToast();

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signup({ name: form.name, email: form.email, password: form.password });
        addToast('Account created! Please sign in.', 'success');
        setMode('login');
        setForm({ name: '', email: form.email, password: '' });
      } else {
        const data = await login({ email: form.email, password: form.password });
        loginUser(data);
        addToast(`Welcome back, ${data.user?.name}!`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-card-top">
          <div className="auth-logo">⬡</div>
          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to TaskForge' : 'Join your team on TaskForge'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-body">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  name="name"
                  placeholder="Anisha Sinha"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {error && <p className="form-error">⚠ {error}</p>}

            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" /> Processing…</>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="auth-footer-text">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <span className="auth-link" onClick={() => { setMode('signup'); setError(''); }}>Sign up</span></>
          ) : (
            <>Already have an account?{' '}
              <span className="auth-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</span></>
          )}
        </p>
      </div>
    </div>
  );
}
