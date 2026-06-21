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
    <div className="min-h-screen bg-[#f4f4f0] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-md w-full text-center">
        <Activity className="w-20 h-20 stroke-[3px] mx-auto mb-6" />
        <h1 className="text-4xl font-black uppercase tracking-widest mb-2">PulseFlow</h1>
        <p className="font-bold text-gray-500 uppercase tracking-widest mb-8 border-b-4 border-black pb-8">Staff Login</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Username Input */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="USERNAME"
              className="w-full bg-gray-100 border-4 border-black p-4 pl-12 text-xl font-bold placeholder-gray-400 focus:outline-none focus:bg-[#ffffb3] transition-colors"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-gray-100 border-4 border-black p-4 pl-12 text-xl font-bold placeholder-gray-400 focus:outline-none focus:bg-[#ffffb3] transition-colors"
              required
            />
          </div>
          
          {/* Error Display */}
          {error && <p className="text-[#ff4d4d] font-bold uppercase">{error}</p>}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`border-4 border-black py-4 text-2xl font-black uppercase tracking-wider transition-colors
              ${isLoading 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'}`}
          >
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t-4 border-black text-center">
          <p className="font-bold text-gray-500 uppercase mb-4">New to PulseFlow?</p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-transparent border-4 border-black py-3 px-6 text-xl font-black uppercase tracking-wider hover:bg-[#ffffb3] transition-colors w-full"
          >
            Register Your Clinic
          </button>
        </div>
      </div>
    </div>
  );
}