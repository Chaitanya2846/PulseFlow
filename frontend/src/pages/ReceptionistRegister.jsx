import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, Building, ArrowRight, UserPlus, ShieldCheck, Monitor, Eye, EyeOff } from 'lucide-react';

export default function ReceptionistRegister() {
  const [formData, setFormData] = useState({ clinicCode: '', name: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/register/receptionist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        navigate('/receptionist/login');
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
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1000px] w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex overflow-hidden relative z-10 border border-white/80">
        
        {/* ========================================== */}
        {/* LEFT SIDE: Form Panel */}
        {/* ========================================== */}
        <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center bg-white relative z-10">
          
          <div className="flex items-center gap-3 text-indigo-600 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-inner border border-indigo-100/50">
              <Activity className="w-5 h-5 stroke-[3px]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">PulseFlow</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Join the network.</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Enter your master <span className="text-indigo-600 font-bold">Clinic Code</span> to securely sync.
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
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-600 transition-colors">Clinic Code</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10">
                    <Building className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.clinicCode}
                    onChange={(e) => setFormData({...formData, clinicCode: e.target.value.toUpperCase()})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-indigo-700 uppercase tracking-wider placeholder:text-slate-300 placeholder:font-medium placeholder:tracking-normal text-sm" 
                    placeholder="e.g. PF-A1B2"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-600 transition-colors">Your Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-600 transition-colors">Create Username</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10">
                  <UserPlus className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-14 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                  placeholder="admin_john"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-indigo-600 transition-colors">Create Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 p-2 bg-slate-100 rounded-lg text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-14 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
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
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 transition-all duration-300 flex justify-center items-center gap-2 mt-6 disabled:opacity-70 group active:scale-[0.98] text-sm"
            >
              {isLoading ? 'Registering...' : 'Create Account'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs font-medium mt-6">
            Already registered? <Link to="/receptionist/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Sign in to your desk</Link>
          </p>
        </div>

        {/* ========================================== */}
        {/* RIGHT SIDE: Immersive Branding Panel */}
        {/* ========================================== */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-10">
          
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-600/40 via-blue-600/10 to-transparent rounded-full blur-[80px] -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
          
          {/* Top Section */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Grade
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.1] mb-4 tracking-tight">
              Flawless <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Synchronization.</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-md">
              Securely bind your front desk to the doctor's cabin. Live updates, priority triage, and zero-latency queuing.
            </p>
          </div>

          {/* ========================================== */}
          {/* THE NEW INFRASTRUCTURE TOPOLOGY WIDGET */}
          {/* ========================================== */}
          <div className="relative z-10 w-full max-w-sm self-center mt-6">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-emerald-500/20 rounded-[2.5rem] blur-xl opacity-70" />

            <div className="relative bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 rounded-[2rem] p-6 shadow-2xl overflow-hidden">
              
              {/* Subtle Animated Blueprint Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

              {/* Header */}
              <div className="relative flex justify-between items-center mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Topology</p>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                  <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-wider">Awaiting Link</span>
                </div>
              </div>

              <div className="relative flex flex-col">

                {/* Node 1: Master Control (Doctor) */}
                <div className="relative bg-slate-900 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between z-10 shadow-lg hover:border-indigo-500/50 transition-colors duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <div className="relative p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-500/30 transition-colors">
                        <Monitor className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Doctor's Cabin</p>
                      <p className="text-slate-400 text-[9px] font-mono mt-0.5">Master Controller Node</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-400/80 text-[7px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 tracking-widest">HOST</span>
                  </div>
                </div>

                {/* Connecting Secure Pathway */}
                <div className="relative h-16 w-full flex flex-col items-center justify-center">
                  {/* Dashed Track line */}
                  <div className="absolute h-full border-l-2 border-dashed border-slate-700" />

                  {/* Glowing Data Beam */}
                  <div className="absolute h-8 w-0.5 bg-gradient-to-b from-indigo-400 to-emerald-400 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)] rounded-full top-2" />

                  {/* Security Lock Centerpiece */}
                  <div className="relative bg-slate-900 border border-slate-700 rounded-full p-1.5 z-10 text-slate-500 shadow-md">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>

                {/* Node 2: Awaiting Connection (Front Desk) */}
                <div className="relative bg-slate-900 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between z-10 shadow-lg hover:border-emerald-500/40 transition-colors duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 bg-slate-800 text-slate-500 rounded-xl border border-slate-700 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all duration-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Front Desk</p>
                      <p className="text-emerald-500/70 text-[9px] font-mono mt-0.5 animate-pulse">Scanning for Clinic Code...</p>
                    </div>
                  </div>
                  
                  {/* Active Scanning Equalizer Bars */}
                  <div className="flex gap-0.5 items-end h-3 mr-1">
                    <div className="w-1 bg-emerald-500/50 rounded-sm h-[40%] animate-pulse delay-75" />
                    <div className="w-1 bg-emerald-500/50 rounded-sm h-[80%] animate-pulse delay-150" />
                    <div className="w-1 bg-emerald-500/50 rounded-sm h-[30%] animate-pulse delay-300" />
                    <div className="w-1 bg-emerald-500/50 rounded-sm h-[60%] animate-pulse delay-75" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
} 