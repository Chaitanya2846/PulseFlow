import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key, User, Mail, Lock } from 'lucide-react';

export default function ReceptionistRegister() {
  const [formData, setFormData] = useState({
    clinicCode: '', name: '', username: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/register/receptionist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicCode: formData.clinicCode,
          name: formData.name,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Send them straight to login on success
        alert("Account created successfully! Please log in.");
        navigate('/receptionist/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Join Staff</h1>
          <p className="text-slate-500 mt-2">Connect to your clinic using the master code</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" required
                onChange={(e) => setFormData({...formData, clinicCode: e.target.value.toUpperCase()})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-semibold tracking-wider"
                placeholder="e.g. PF-8X2K91" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" required
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Jane Doe" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" required
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="jane.desk" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" required
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
              <input 
                type="password" required
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••" 
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 mt-4"
          >
            {isLoading ? 'Joining...' : 'Join Clinic'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already registered? <Link to="/receptionist/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}