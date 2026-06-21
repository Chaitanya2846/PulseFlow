import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Clock, Activity, Bell, CheckCircle2, Users } from 'lucide-react'; // Added Users import

export default function MobileTracking() {
  const { trackingId } = useParams(); 
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now()); // Live ticker
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
          if (!hasJoined.current && data.clinic.clinicId) {
            socket.emit('join_clinic_room', data.clinic.clinicId);
            hasJoined.current = true;
          }
        }
      }).catch(() => setError("Network error."));
  };

  useEffect(() => {
    fetchTrackingData();
    socket.on('queue_updated', (newData) => {
      // Merge live socket updates into our state
      setTrackingData(prev => ({
        ...prev,
        clinic: { ...prev.clinic, activeToken: newData.activeToken, averageTime: newData.averageTime, currentPatientCalledAt: newData.currentPatientCalledAt },
      }));
      // Re-fetch to recalculate 'peopleAhead' exactly
      fetchTrackingData(); 
    });
    return () => socket.off('queue_updated');
  }, [trackingId]);

  if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center text-red-500 font-bold">{error}</div>;
  if (!trackingData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-bold animate-pulse text-slate-500">Locating Token...</div>;

  const { patient, clinic, peopleAhead } = trackingData;

  // ========================================================
  // THE MAGIC: REAL-TIME ELAPSED WAIT CALCULATION
  // ========================================================
  let estimatedWait = 0;
  
  if (clinic.activeToken === 0) {
    // No one is in the cabin, so next patient goes in instantly.
    estimatedWait = peopleAhead * clinic.averageTime;
  } else {
    // Someone is inside. Calculate how long they've been there.
    const elapsedMs = now - new Date(clinic.currentPatientCalledAt).getTime();
    const elapsedMins = elapsedMs / 60000;
    
    // Ensure the current patient has at least 1 minute remaining, even if they exceed the average.
    const remainingForCurrentPatient = Math.max(clinic.averageTime - elapsedMins, 1);
    
    // Total wait = (Remaining time of person inside) + (Full avg time for everyone waiting ahead of me)
    estimatedWait = remainingForCurrentPatient + (peopleAhead * clinic.averageTime);
  }

  // Use Math.ceil to always round up slightly (e.g. 12.2 mins -> 13 mins) so patients aren't surprised.
  const finalDisplayWait = Math.ceil(Math.max(estimatedWait, 0));

  const isMyTurn = patient.status === 'serving';
  const isCompleted = patient.status === 'completed';

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Turn Completed</h1>
        <p className="text-lg text-slate-500">Your consultation at {clinic.name} is over. Wishing you good health!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0">
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

        {isMyTurn ? (
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl shadow-lg p-8 text-center text-white animate-pulse">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-black mb-2 tracking-tight">It's Your Turn!</h2>
            <p className="text-emerald-50 font-medium">Please proceed to the doctor's cabin immediately.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">Your Token Number</p>
              <div className="text-7xl font-black text-slate-900 tracking-tighter">A-{patient.tokenNumber}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 text-white rounded-3xl p-6 text-center shadow-md shadow-blue-600/20">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <p className="text-blue-100 font-semibold text-sm mb-1">Live Wait</p>
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