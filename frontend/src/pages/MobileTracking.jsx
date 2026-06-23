import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Clock, Activity, Bell, CheckCircle2, Users, ShieldAlert, XCircle } from 'lucide-react';

export default function MobileTracking() {
  const { trackingId } = useParams(); 
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now()); 
  const hasJoined = useRef(false);

  // 1. Live Ticker Engine: Forces a UI re-calculation every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingData = () => {
    fetch(`http://${window.location.hostname}:5000/api/queue/track/${trackingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setError(data.message);
        else {
          setTrackingData(data);
          // Only join the socket room once
          if (!hasJoined.current && data.clinic.clinicId) {
            socket.emit('join_clinic_room', data.clinic.clinicId);
            hasJoined.current = true;
          }
        }
      }).catch(() => setError("Network error."));
  };

  useEffect(() => {
    fetchTrackingData();
    
    // Listen for real-time queue shifts from the backend
    socket.on('queue_updated', (newData) => {
      setTrackingData(prev => ({
        ...prev,
        clinic: { 
          ...prev.clinic, 
          activeToken: newData.activeToken, 
          averageTime: newData.averageTime, 
          currentPatientCalledAt: newData.currentPatientCalledAt,
          isPaused: newData.isPaused,       // Catch pause state
          pauseReason: newData.pauseReason  // Catch pause reason
        },
      }));
      // Re-fetch to recalculate 'peopleAhead' and check if our specific status changed to 'cancelled'
      fetchTrackingData(); 
    });
    
    return () => socket.off('queue_updated');
  }, [trackingId]);

  if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-red-500 font-bold">{error}</div>;
  if (!trackingData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-bold animate-pulse text-slate-500">Locating Token...</div>;

  const { patient, clinic, peopleAhead } = trackingData;

  const isMyTurn = patient.status === 'serving';
  const isCompleted = patient.status === 'completed';
  const isSkipped = patient.status === 'skipped';
  const isCancelled = patient.status === 'cancelled';

  // ========================================================
  // TERMINAL VIEWS: Intercept state before doing any math
  // ========================================================

  // --- VIEW 1: COMPLETED ---
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Turn Completed</h1>
        <p className="text-lg text-slate-500">Your consultation at {clinic.name} is over. Wishing you good health!</p>
      </div>
    );
  }

  // --- VIEW 2: CANCELLED (2nd Strike) ---
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-20 h-20 bg-red-500/20 border border-red-500 text-red-500 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 stroke-[2.5px]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2 text-red-400">Token Cancelled</h1>
        <p className="text-slate-400 max-w-sm mb-8 text-md leading-relaxed">
          You missed your recall turn. Your token <span className="text-white font-bold">A-{patient.tokenNumber}</span> has been permanently removed from the queue.
        </p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-xs shadow-inner">
          <p className="text-sm font-semibold text-slate-200">Please visit the front desk to generate a new token.</p>
        </div>
      </div>
    );
  }

  // --- VIEW 3: SKIPPED / RECALL WARNING (1st Strike) ---
  if (isSkipped) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-20 h-20 bg-amber-500/20 border border-amber-500 text-amber-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <ShieldAlert className="w-10 h-10 stroke-[2.5px]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2 text-amber-400">Token Called but Absent</h1>
        <p className="text-slate-400 max-w-sm mb-8 text-md leading-relaxed">
          The clinic called token <span className="text-white font-bold">A-{patient.tokenNumber}</span>, but you were unavailable. Your position is saved inside the <span className="text-amber-400 font-semibold">Recall Queue</span>.
        </p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-xs shadow-inner">
          <p className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">Action Required</p>
          <p className="text-sm font-semibold text-slate-200">Please report to the receptionist desk to re-activate your spot immediately.</p>
        </div>
      </div>
    );
  }

  // ========================================================
  // THE MAGIC: REAL-TIME ELAPSED WAIT CALCULATION
  // ========================================================
  let estimatedWait = 0;
  
  if (clinic.activeToken === 0) {
    estimatedWait = peopleAhead * clinic.averageTime;
  } else {
    const elapsedMs = now - new Date(clinic.currentPatientCalledAt).getTime();
    const elapsedMins = elapsedMs / 60000;
    const remainingForCurrentPatient = Math.max(clinic.averageTime - elapsedMins, 1);
    estimatedWait = remainingForCurrentPatient + (peopleAhead * clinic.averageTime);
  }

  const finalDisplayWait = Math.ceil(Math.max(estimatedWait, 0));

  // --- VIEW 4: ACTIVE WAITING OR SERVING ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-600">
          <Activity className="w-6 h-6" />
          <span className="font-bold text-lg">PulseFlow Tracker</span>
        </div>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Live</span>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8 space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-slate-800">{clinic.name}</h2>
          <p className="text-slate-500 text-sm mt-1">Hello, {patient.name}</p>
        </div>

        {/* DOCTOR PAUSED BANNER */}
        {clinic.isPaused && (
          <div className="bg-amber-100 border-2 border-amber-400 text-amber-800 p-5 rounded-3xl text-center shadow-lg mb-6 transform transition-all duration-500">
            <div className="bg-amber-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black mb-1 tracking-tight">Queue Paused</h3>
            <p className="font-medium text-amber-700/80 text-sm">{clinic.pauseReason || 'Doctor is currently unavailable.'}</p>
            <p className="text-xs font-bold text-amber-600 mt-3 uppercase tracking-widest">Wait times are frozen</p>
          </div>
        )}

        {/* PRIORITY TRIAGE BANNERS */}
        {patient.priority === 'Emergency' && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 animate-pulse shadow-sm">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wide">Emergency Priority Active</span>
          </div>
        )}
        
        {patient.priority === 'High' && (
          <div className="bg-orange-100 border border-orange-200 text-orange-700 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm">
            <Activity className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wide">High Priority Active</span>
          </div>
        )}

        {isMyTurn ? (
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl shadow-lg p-8 text-center text-white animate-pulse">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-black mb-2 tracking-tight">It's Your Turn!</h2>
            <p className="text-emerald-50 font-medium">Please proceed to the doctor's cabin immediately.</p>
          </div>
        ) : (
          <>
            <div className={`bg-white rounded-3xl shadow-sm border p-8 text-center relative overflow-hidden ${patient.priority === 'Emergency' ? 'border-red-200' : patient.priority === 'High' ? 'border-orange-200' : 'border-slate-100'}`}>
              <div className={`absolute top-0 left-0 w-full h-1.5 ${patient.priority === 'Emergency' ? 'bg-red-500' : patient.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Your Token Number</p>
              <div className={`text-7xl font-black tracking-tighter ${patient.priority === 'Emergency' ? 'text-red-600' : patient.priority === 'High' ? 'text-orange-600' : 'text-slate-900'}`}>
                A-{patient.tokenNumber}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`text-white rounded-3xl p-6 text-center shadow-md ${patient.priority === 'Emergency' ? 'bg-red-600 shadow-red-600/20' : patient.priority === 'High' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-600 shadow-blue-600/20'}`}>
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <p className="text-white/80 font-semibold text-sm mb-1">Live Wait</p>
                <p className="text-3xl font-black">~{finalDisplayWait}<span className="text-lg font-medium">m</span></p>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm">
                <Users className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-500 font-semibold text-sm mb-1">Ahead of You</p>
                <p className="text-3xl font-black text-slate-900">{peopleAhead}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 text-center shadow-md mt-6">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Doctor is Currently Serving</p>
              <p className="text-4xl font-black">A-{clinic.activeToken === 0 ? '--' : clinic.activeToken}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}