import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, CheckCircle2, LogOut, ArrowRight, Users, Clock, UserCheck } from 'lucide-react';

export default function DoctorDashboard() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [] });
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

  const handleCallNext = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/queue/advance`, { method: 'PUT', headers: authHeaders });
      if (!res.ok) alert((await res.json()).message);
    } catch (error) {
      console.error("Error advancing queue:", error);
    } finally { 
      setTimeout(() => setIsLoading(false), 1000); 
    }
  };

  const handleComplete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/queue/complete`, { method: 'PUT', headers: authHeaders });
      if (!res.ok) alert((await res.json()).message);
    } catch (error) {
      console.error("Error completing consultation:", error);
    } finally { 
      setTimeout(() => setIsLoading(false), 1000); 
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/doctor/login');
  };

  const isRoomEmpty = queueData.activeToken === 0;
  const nextPatient = queueData.waitingList.length > 0 ? queueData.waitingList[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="p-2 bg-blue-50 rounded-lg"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Doctor Suite</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Control Panel</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-8 mt-8">
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
              <p className="text-2xl font-bold text-slate-900">{queueData.averageTime} <span className="text-sm font-normal text-slate-500">min</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Inside Cabin</h2>
              <div className="text-9xl font-black text-slate-900 tracking-tighter mb-12">
                {isRoomEmpty ? '--' : `A-${queueData.activeToken}`}
              </div>
              
              {isRoomEmpty ? (
                <button 
                  onClick={handleCallNext} disabled={isLoading || !nextPatient}
                  className={`w-full py-6 rounded-2xl text-2xl font-bold flex justify-center items-center gap-3 transition-all ${!nextPatient ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-1'}`}
                >
                  {isLoading ? 'Processing...' : (nextPatient ? `Call Next: A-${nextPatient.tokenNumber}` : 'Queue is Empty')}
                  {!isLoading && nextPatient && <ArrowRight className="w-6 h-6" />}
                </button>
              ) : (
                <button 
                  onClick={handleComplete} disabled={isLoading}
                  className="w-full py-6 rounded-2xl text-2xl font-bold flex justify-center items-center gap-3 transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-1"
                >
                  {isLoading ? 'Processing...' : 'Complete Consultation'}
                  {!isLoading && <CheckCircle2 className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
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
                      <li key={p._id} className={`flex items-center p-4 rounded-2xl border ${i === 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mr-4 ${i === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600'}`}>
                          {p.tokenNumber}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          {i === 0 && <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">Next Patient</p>}
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