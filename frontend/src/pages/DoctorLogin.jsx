import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock } from 'lucide-react';

export default function DoctorLogin() {
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
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.role !== 'doctor') {
          setError('Access denied. This portal is for doctors only.');
          return;
        }
        localStorage.setItem('pulseflow_token', data.token);
        localStorage.setItem('pulseflow_role', data.role);
        localStorage.setItem('pulseflow_clinicId', data.clinicId);
        navigate('/doctor/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Portal</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your clinic queue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="dr.smith" required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••" required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Suite'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Need to register your clinic? <Link to="/doctor/register" className="text-blue-600 hover:text-blue-700 font-semibold">Create account</Link>
        </p>
      </div>
    </div>
  );
}