import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, User, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Use dynamic hostname so it works on both PC and mobile testing
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Securely store the JWT and user data
        localStorage.setItem('pulseflow_token', data.token);
        localStorage.setItem('pulseflow_role', data.role);
        localStorage.setItem('pulseflow_clinicId', data.clinicId);

        // Route them to their specific dashboard based on their role
        if (data.role === 'receptionist') navigate('/receptionist');
        if (data.role === 'doctor') navigate('/doctor');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server connection failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
            PulseFlow
          </h1>
        </div>
      </div>

      {/* Login Card */}
      <div className="card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--color-text)' }}>
          Staff Sign In
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Access your clinic dashboard
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Username Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10"
                required
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="p-3 rounded-md text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-error-light)',
                color: 'var(--color-error)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            New to PulseFlow?
          </p>
          <button
            onClick={() => navigate('/register')}
            className="mt-3 text-base font-semibold transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            Create clinic account →
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center mt-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Questions? <a href="/" className="font-medium" style={{ color: 'var(--color-primary)' }}>Visit our homepage</a>
      </p>
    </div>
  );
}
