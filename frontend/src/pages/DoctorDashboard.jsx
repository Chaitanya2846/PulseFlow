import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, CheckCircle2, LogOut, Users, Clock, UserCheck, ShieldAlert, PauseCircle, PlayCircle, Stethoscope, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
export default function DoctorDashboard() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [], clinicCode: '', isPaused: false, pauseReason: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const hasJoined = useRef(false);

  const clinicId = localStorage.getItem('pulseflow_clinicId');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('pulseflow_token')}`
  };

  useEffect(() => {
    if (clinicId && !hasJoined.current) {
      socket.emit('join_clinic_room', clinicId);
      hasJoined.current = true;
    }

    fetch(`http://${window.location.hostname}:5000/api/queue/state?clinicId=${clinicId}`)
      .then(res => res.json())
      .then(setQueueData);

    socket.on('queue_updated', setQueueData);
    return () => socket.off('queue_updated');
  }, [clinicId]);

  const handleComplete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/queue/complete`, { method: 'PUT', headers: authHeaders });
      if (!res.ok) alert((await res.json()).message);
    } catch (error) {
      console.error("Error completing consultation:", error);
    } finally { 
      setTimeout(() => setIsLoading(false), 500); 
    }
  };

  const handleTogglePause = async () => {
    const reason = queueData.isPaused ? '' : window.prompt("Reason for pausing the queue?", "Taking a short break");
    if (!queueData.isPaused && reason === null) return; // User clicked cancel

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/pause`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/doctor/login');
  };

  const isRoomEmpty = queueData.activeToken === 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-12 overflow-x-hidden relative">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ========================================== */}
      {/* GLASSMORPHIC NAVBAR */}
      {/* ========================================== */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 text-emerald-600">
          <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50 shadow-sm">
            <Activity className="w-5 h-5 stroke-[3px]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Doctor Suite</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Control Panel</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-4 py-2 rounded-xl text-sm shadow-inner">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Network ID:</span>
            <span className="text-emerald-600 tracking-widest font-black uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {queueData.clinicCode || '---'}
            </span>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors px-4 py-2.5 rounded-xl hover:bg-red-50 active:scale-95">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ========================================== */}
      {/* MAIN DASHBOARD CONTENT */}
      {/* ========================================== */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-8 relative z-10">
        
        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Waiting Roster</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{queueData.waitingList.length} <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Patients</span></p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inside Cabin</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{isRoomEmpty ? 'None' : `A-${queueData.activeToken}`}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Consult Pace</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{Math.round(queueData.averageTime)} <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">min</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Consultation Console */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`rounded-[2.5rem] shadow-2xl p-10 sm:p-14 text-center flex-1 flex flex-col justify-center relative overflow-hidden min-h-[480px] transition-all duration-700 border border-white/20
              ${queueData.isPaused 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-600/20' 
                : isRoomEmpty 
                  ? 'bg-white border border-slate-200/60 shadow-sm' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-600/20'}`}
            >
              {/* Dynamic Background Watermark */}
              <Stethoscope className={`absolute -right-10 -bottom-10 w-64 h-64 pointer-events-none transition-all duration-700
                ${queueData.isPaused ? 'text-amber-900 opacity-10' : isRoomEmpty ? 'text-slate-200 opacity-50' : 'text-emerald-900 opacity-10'}`} 
              />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border 
                  ${queueData.isPaused ? 'bg-amber-900/20 text-amber-100 border-amber-400/30' : isRoomEmpty ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-900/30 text-emerald-100 border-emerald-400/30'}`}>
                  {queueData.isPaused ? <><ShieldAlert className="w-3.5 h-3.5"/> SYSTEM PAUSED</> : <><Activity className="w-3.5 h-3.5" /> LIVE CABIN STATUS</>}
                </div>
                
                <div className={`text-8xl sm:text-[10rem] leading-none font-black tracking-tighter mb-12 select-none drop-shadow-md transition-colors duration-500
                  ${queueData.isPaused ? 'text-amber-50' : isRoomEmpty ? 'text-slate-300' : 'text-white'}`}>
                  {isRoomEmpty ? '--' : `A-${queueData.activeToken}`}
                </div>
                
                <div className="w-full space-y-4 max-w-md mx-auto">
                  {isRoomEmpty ? (
                    <div className={`w-full border-2 rounded-2xl py-6 px-6 flex flex-col items-center justify-center gap-2 border-dashed backdrop-blur-md transition-colors duration-500
                      ${queueData.isPaused ? 'bg-amber-900/20 border-amber-400/50 text-amber-50' : 'bg-slate-50/50 border-slate-300 text-slate-500'}`}>
                      {queueData.isPaused ? (
                        <>
                          <ShieldAlert className="w-8 h-8 text-amber-300 mb-1" />
                          <p className="font-bold text-lg">Queue Frozen</p>
                          <p className="text-amber-200/80 text-sm font-medium uppercase tracking-wider">{queueData.pauseReason}</p>
                        </>
                      ) : (
                        <>
                          <Zap className="w-8 h-8 text-slate-400 mb-1 animate-pulse" />
                          <p className="font-bold text-lg text-slate-600">Cabin Available</p>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Awaiting front desk dispatch...</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={handleComplete} disabled={isLoading || queueData.isPaused}
                      className="w-full py-5 rounded-2xl text-xl font-black flex justify-center items-center gap-3 transition-all duration-300 bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl shadow-slate-900/10 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                    >
                      {isLoading ? 'Processing...' : 'Complete Consultation'}
                      {!isLoading && <CheckCircle2 className="w-6 h-6" />}
                    </button>
                  )}

                  {/* PAUSE TOGGLE BUTTON */}
                  <button 
                    onClick={handleTogglePause}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 transition-all duration-300 border-2 active:scale-95
                      ${queueData.isPaused 
                        ? 'bg-white text-amber-700 border-white hover:bg-amber-50 shadow-xl shadow-amber-900/20 hover:-translate-y-1' 
                        : isRoomEmpty 
                          ? 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                          : 'bg-emerald-800/40 text-emerald-100 border-emerald-400/30 hover:bg-emerald-800/60 backdrop-blur-md'}`}
                  >
                    {queueData.isPaused ? (
                      <><PlayCircle className="w-5 h-5 fill-current" /> Resume Operations</>
                    ) : (
                      <><PauseCircle className="w-5 h-5" /> Pause Queue (Take Break)</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Up Next / Roster Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-[480px]">
              
              <div className="p-8 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Up Next</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Waiting Roster</p>
                </div>
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black px-3 py-1.5 rounded-lg shadow-sm">{queueData.waitingList.length} Waiting</span>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {queueData.waitingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="p-4 bg-slate-100 rounded-2xl mb-4"><Users className="w-8 h-8 opacity-40" /></div>
                    <p className="font-bold text-slate-500 text-sm">No patients waiting</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {queueData.waitingList.map((p, i) => (
                      <li key={p._id} className={`flex items-center p-4 rounded-2xl border transition-all duration-300 ${i === 0 ? 'bg-white border-indigo-200 shadow-md transform -translate-y-0.5' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl mr-5 shadow-inner border ${i === 0 ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-indigo-400' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          A-{p.tokenNumber}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-900 tracking-tight text-lg leading-tight">{p.name}</p>
                              {i === 0 && <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Next to enter</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {p.priority === 'Emergency' && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm shadow-red-500/30 uppercase tracking-widest animate-pulse">EMG</span>}
                              {p.priority === 'High' && <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm shadow-orange-500/30 uppercase tracking-widest">HIGH</span>}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 ml-2 ${i === 0 ? 'text-indigo-400' : 'text-slate-300'}`} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}