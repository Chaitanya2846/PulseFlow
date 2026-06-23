import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, CheckCircle2, LogOut, Users, Clock, UserCheck, ShieldAlert, PauseCircle, PlayCircle } from 'lucide-react';

export default function DoctorDashboard() {
  // ADDED: isPaused and pauseReason to initial state
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

  // NEW: Doctor controls the pause state
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Navbar with Live Clinic Code Display */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="p-2 bg-blue-50 rounded-lg"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Doctor Suite</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Control Panel</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 shadow-inner">
            <span className="text-slate-400 font-medium">Clinic network ID:</span>
            <span className="text-blue-600 tracking-wider font-black uppercase">{queueData.clinicCode || 'Loading...'}</span>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 mt-8">
        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Waiting Patients</p>
              <p className="text-2xl font-bold text-slate-900">{queueData.waitingList.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCheck className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Currently Serving</p>
              <p className="text-2xl font-bold text-slate-900">{isRoomEmpty ? 'None' : `A-${queueData.activeToken}`}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Consult Time</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(queueData.averageTime)} <span className="text-sm font-normal text-slate-500">min</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Main Consultation Console */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`rounded-3xl shadow-sm border p-12 text-center flex-1 flex flex-col justify-center relative overflow-hidden min-h-[420px] transition-colors duration-500 ${queueData.isPaused ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
              <div className={`absolute top-0 left-0 w-full h-2 ${queueData.isPaused ? 'bg-amber-400 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}></div>
              
              <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 ${queueData.isPaused ? 'text-amber-500' : 'text-slate-400'}`}>
                {queueData.isPaused ? 'QUEUE IS PAUSED' : 'Inside Cabin'}
              </h2>
              
              <div className={`text-9xl font-black tracking-tighter mb-12 select-none ${queueData.isPaused ? 'text-amber-900/50' : 'text-slate-900'}`}>
                {isRoomEmpty ? '--' : `A-${queueData.activeToken}`}
              </div>
              
              <div className="space-y-4">
                {isRoomEmpty ? (
                  /* STRICT STATE GUARD: Tells doctor to wait */
                  <div className={`w-full border rounded-2xl py-6 px-4 flex items-center justify-center gap-3 font-semibold text-lg border-dashed ${queueData.isPaused ? 'bg-amber-100/50 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <ShieldAlert className={`w-6 h-6 ${queueData.isPaused ? 'text-amber-500' : 'text-slate-400 animate-pulse'}`} />
                    {queueData.isPaused ? `Paused: ${queueData.pauseReason}` : 'Waiting for front desk to dispatch next token...'}
                  </div>
                ) : (
                  /* Doctor Control Action */
                  <button 
                    onClick={handleComplete} disabled={isLoading || queueData.isPaused}
                    className="w-full py-6 rounded-2xl text-2xl font-bold flex justify-center items-center gap-3 transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isLoading ? 'Processing...' : 'Complete Consultation'}
                    {!isLoading && <CheckCircle2 className="w-6 h-6" />}
                  </button>
                )}

                {/* PAUSE TOGGLE BUTTON */}
                <button 
                  onClick={handleTogglePause}
                  className={`w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all border-2 ${queueData.isPaused ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/30' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300'}`}
                >
                  {queueData.isPaused ? (
                    <><PlayCircle className="w-5 h-5" /> Resume Operations</>
                  ) : (
                    <><PauseCircle className="w-5 h-5" /> Pause Queue (Take Break)</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Up Next / Roster Preview */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[420px]">
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Up Next</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{queueData.waitingList.length} Waiting</span>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                {queueData.waitingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Users className="w-12 h-12 mb-2 opacity-50" />
                    <p className="font-medium">No patients waiting</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {queueData.waitingList.map((p, i) => (
                      <li key={p._id} className={`flex items-center p-4 rounded-2xl border ${i === 0 ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-white border-slate-100'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mr-4 ${i === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                          A-{p.tokenNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{p.name}</p>
                            {p.priority === 'Emergency' && <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">EMG</span>}
                            {p.priority === 'High' && <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">HIGH</span>}
                          </div>
                          {i === 0 && <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">Next in Line</p>}
                        </div>
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