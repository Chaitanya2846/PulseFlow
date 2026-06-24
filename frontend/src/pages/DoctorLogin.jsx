import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function DoctorLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pulseflow_token', data.token);
        localStorage.setItem('pulseflow_role', data.role);
        localStorage.setItem('pulseflow_clinicId', data.clinicId);
        navigate('/doctor/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1000px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex overflow-hidden relative z-10 border border-white/80">
        
        {/* ========================================== */}
        {/* LEFT SIDE: Form Panel */}
        {/* ========================================== */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white relative z-10">
          
          <div className="flex items-center gap-3 text-emerald-600 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-inner border border-emerald-100/50">
              <Activity className="w-6 h-6 stroke-[3px]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">PulseFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome, Doctor.</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Sign in to your private cabin dashboard to oversee consultations and <span className="text-emerald-600 font-bold">control the flow</span>.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-bold mb-6 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-600 transition-colors">Username</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-600 transition-colors">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-14 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-2 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-emerald-600/30 transition-all duration-300 flex justify-center items-center gap-2 mt-6 disabled:opacity-70 group active:scale-[0.98]"
            >
              {isLoading ? 'Authenticating...' : 'Enter Cabin Dashboard'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm font-medium mt-8">
            Setting up a new clinic? <Link to="/doctor/register" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">Register here</Link>
          </p>
        </div>

        {/* ========================================== */}
        {/* RIGHT SIDE: Minimalist Branding Panel */}
        {/* ========================================== */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-center items-center p-12">
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-600/30 via-teal-600/10 to-transparent rounded-full blur-[80px] -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

          {/* Centered Minimal Text */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.2] tracking-tight">
              Focus on patients. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Let us handle the line.</span>
            </h2>
          </div>

        </div>

      </div>
    </div>
  );
}