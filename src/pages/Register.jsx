import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/workspaces', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
            E
          </div>
          <div>
            <h1 className="text-base font-bold text-white">ERP Lead Engine</h1>
            <p className="text-xs text-gray-500">B2B Lead Generation</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Account aanmaken</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mailadres</label>
              <input
                className="input"
                type="email"
                placeholder="jij@bedrijf.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Wachtwoord</label>
              <input
                className="input"
                type="password"
                placeholder="Minimaal 8 tekens"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Bevestig wachtwoord</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Al een account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
