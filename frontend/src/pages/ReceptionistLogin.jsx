import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, ArrowRight, ShieldCheck, Smartphone, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function ReceptionistLogin() {
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
        navigate('/receptionist/dashboard');
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
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1000px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex overflow-hidden relative z-10 border border-white/80">
        
        {/* ========================================== */}
        {/* LEFT SIDE: Form Panel */}
        {/* ========================================== */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white relative z-10">
          
          <div className="flex items-center gap-3 text-indigo-600 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-inner border border-indigo-100/50">
              <Activity className="w-6 h-6 stroke-[3px]" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">PulseFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome back.</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Sign in to manage the front desk, oversee triage, and control the <span className="text-indigo-600 font-bold">live queue</span>.
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-600 transition-colors">Username</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-600 transition-colors">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-14 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 transition-all duration-300 flex justify-center items-center gap-2 mt-6 disabled:opacity-70 group active:scale-[0.98]"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm font-medium mt-8">
            Don't have an account? <Link to="/receptionist/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Register Clinic</Link>
          </p>
        </div>

        {/* ========================================== */}
        {/* RIGHT SIDE: Immersive Branding Panel */}
        {/* ========================================== */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-10">
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-600/40 via-blue-600/10 to-transparent rounded-full blur-[80px] -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

          {/* Top Section */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-5">
              <ShieldCheck className="w-3.5 h-3.5" /> Operations Active
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.1] mb-4 tracking-tight">
              Manage the flow. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Master the queue.</span>
            </h2>
          </div>

          {/* Front Desk Toolkit Stack */}
          <div className="relative z-10 w-full max-w-sm self-center mt-6 space-y-3">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 p-4 rounded-xl flex items-center gap-4 transform transition-all duration-500 hover:-translate-y-1 hover:bg-slate-800/80 shadow-xl ml-0">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-lg shadow-inner border border-indigo-500/20"><Activity className="w-4 h-4"/></div>
              <div>
                <h4 className="text-white font-bold text-sm">Smart Triage</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Automated priority-based sorting.</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 p-4 rounded-xl flex items-center gap-4 transform transition-all duration-500 hover:-translate-y-1 hover:bg-slate-800/80 shadow-xl ml-6">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg shadow-inner border border-emerald-500/20"><Smartphone className="w-4 h-4"/></div>
              <div>
                <h4 className="text-white font-bold text-sm">Live SMS Sync</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Real-time mobile tracking for patients.</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-600/50 p-4 rounded-xl flex items-center gap-4 transform transition-all duration-500 hover:-translate-y-1 hover:bg-slate-800/80 shadow-xl ml-12">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg shadow-inner border border-amber-500/20"><RefreshCw className="w-4 h-4"/></div>
              <div>
                <h4 className="text-white font-bold text-sm">Absent Recalls</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Hold and recall skipped tokens seamlessly.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}