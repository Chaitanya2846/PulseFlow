import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, User, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function DoctorRegister() {
  const [formData, setFormData] = useState({
    clinicName: '', name: '', username: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null); 
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/register/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: formData.clinicName,
          doctorName: formData.name, 
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // FIX: The backend sends clinicCode at the top level of the JSON response
        setSuccessCode(data.clinicCode); 
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (successCode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-10 text-center border border-slate-100">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Clinic Created!</h2>
          <p className="text-slate-500 mb-8">Your clinic has been successfully registered.</p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">Your Clinic Code</p>
            {/* The code will now definitely show here */}
            <p className="text-4xl font-black text-slate-900 tracking-wider">{successCode}</p>
          </div>
          
          <p className="text-sm text-slate-500 mb-8">
            Copy this code! Receptionists need this to join your clinic network.
          </p>

          <button 
            onClick={() => navigate('/doctor/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM (Same as before)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Register Clinic</h1>
          <p className="text-slate-500 mt-2">Create your master doctor account</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Name</label>
            <div className="relative">
              <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" required
                onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="City Hospital" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" required
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Dr. Smith" 
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="dr.smith" 
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
              <input 
                type="password" required
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••" 
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 mt-4"
          >
            {isLoading ? 'Creating...' : 'Register Clinic'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account? <Link to="/doctor/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}