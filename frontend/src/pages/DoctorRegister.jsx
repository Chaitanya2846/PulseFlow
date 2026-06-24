import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, Building, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function DoctorRegister() {
  const [formData, setFormData] = useState({ clinicName: '', name: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/register/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        navigate('/doctor/login');
      } else {
        setError(data.message || 'Registration failed');
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
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1000px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex overflow-hidden relative z-10 border border-white/80">
        
        {/* ========================================== */}
        {/* LEFT SIDE: Form Panel */}
        {/* ========================================== */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white relative z-10">
          
          <div className="flex items-center gap-3 text-emerald-600 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-inner border border-emerald-100/50">
              <Activity className="w-5 h-5 stroke-[3px]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">PulseFlow</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Establish your clinic.</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Create the master node and generate a secure access code for your front-desk staff.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg text-sm font-bold mb-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-emerald-600 transition-colors">Clinic Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors z-10">
                    <Building className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.clinicName}
                    onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                    placeholder="City Hospital"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-emerald-600 transition-colors">Dr. Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors z-10">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-emerald-600 transition-colors">Create Username</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors z-10">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-14 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                  placeholder="dr_johndoe"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-emerald-600 transition-colors">Create Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-14 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
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
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-emerald-600/30 transition-all duration-300 flex justify-center items-center gap-2 mt-6 disabled:opacity-70 group active:scale-[0.98] text-sm"
            >
              {isLoading ? 'Initializing System...' : 'Initialize Clinic Node'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs font-medium mt-6">
            Already established? <Link to="/doctor/login" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">Sign in to your cabin</Link>
          </p>
        </div>

        {/* ========================================== */}
        {/* RIGHT SIDE: Minimalist Branding Panel */}
        {/* ========================================== */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-center items-center p-10">
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-600/30 via-teal-600/10 to-transparent rounded-full blur-[80px] -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

          {/* Centered Minimal Text */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.2] mb-6 tracking-tight">
              Create your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Master Control Node.</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm">
              Registering automatically generates a unique encryption code for your staff, ensuring your queue data remains completely isolated.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}