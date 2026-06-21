import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, CheckSquare, LogOut, ArrowRight, Users } from 'lucide-react';

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
      .then(data => setQueueData(data));

    socket.on('queue_updated', setQueueData);
    return () => socket.off('queue_updated');
  }, [clinicId]);

  const handleCallNext = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/advance`, { 
        method: 'PUT', 
        headers: authHeaders 
      });
      
      const data = await response.json();
      
      // IF THE BACKEND BLOCKS US, SHOW THE ERROR ON SCREEN
      if (!response.ok) {
        alert(`Request Blocked: ${data.message}`);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleComplete = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/complete`, { 
        method: 'PUT', 
        headers: authHeaders 
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(`Request Blocked: ${data.message}`);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isRoomEmpty = queueData.activeToken === 0;
  const nextPatient = queueData.waitingList.length > 0 ? queueData.waitingList[0] : null;

  return (
    <div className="min-h-screen bg-[#e6f2ff] p-8 font-sans">
      <header className="mb-10 flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight flex items-center gap-3">
            <Activity className="w-12 h-12 stroke-[3px]" /> PulseFlow
          </h1>
          <p className="text-xl font-bold mt-2 text-[#0066cc] uppercase tracking-widest">Doctor Suite</p>
        </div>
        <button onClick={handleLogout} className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 flex items-center gap-2 font-black uppercase hover:bg-gray-100">
          <LogOut className="w-6 h-6" /> Exit
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
        {/* DOCTOR CONTROL PANEL */}
        <div className="flex flex-col gap-8">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 text-center flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold uppercase tracking-widest mb-4 text-gray-500">Currently Inside</h2>
            <div className="text-[10rem] leading-none font-black tracking-tighter mb-8 text-[#0066cc]">
              {isRoomEmpty ? '--' : `A-${queueData.activeToken}`}
            </div>
            
            {/* DYNAMIC BUTTON: Switches based on whether the room is empty */}
            {isRoomEmpty ? (
              <button 
                onClick={handleCallNext} disabled={isLoading || !nextPatient}
                className={`w-full py-8 border-4 border-black text-4xl font-black uppercase flex justify-center items-center gap-4 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${!nextPatient ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#ff4d4d] hover:bg-[#ff3333] text-white active:translate-y-2 active:shadow-none'}`}
              >
                {isLoading ? 'Processing...' : (nextPatient ? `Call Next: A-${nextPatient.tokenNumber}` : 'Queue Empty')}
                {!isLoading && nextPatient && <ArrowRight className="w-10 h-10 stroke-[4px]" />}
              </button>
            ) : (
              <button 
                onClick={handleComplete} disabled={isLoading}
                className={`w-full py-8 border-4 border-black text-4xl font-black uppercase flex justify-center items-center gap-4 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#33cc33] hover:bg-[#2eb82e] text-white active:translate-y-2 active:shadow-none`}
              >
                {isLoading ? 'Processing...' : 'Complete Consultation'}
                {!isLoading && <CheckSquare className="w-10 h-10 stroke-[4px]" />}
              </button>
            )}
          </div>
        </div>

        {/* WAITING LIST PREVIEW */}
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="bg-black text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase flex items-center gap-3"><Users /> Waiting Queue Preview</h2>
            <span className="font-bold text-xl bg-white text-black px-3 py-1">{queueData.waitingList.length} Waiting</span>
          </div>
          <div className="p-6 overflow-y-auto max-h-[600px] flex-1">
            {queueData.waitingList.length === 0 ? (
              <p className="text-center text-gray-500 font-bold text-2xl mt-12 uppercase">No patients waiting</p>
            ) : (
              <ul className="space-y-4">
                {queueData.waitingList.map((p, i) => (
                  <li key={p._id} className={`flex justify-between items-center p-4 border-4 border-black ${i === 0 ? 'bg-[#ffffb3]' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-black">A-{p.tokenNumber}</span>
                      <div>
                        <p className="text-xl font-bold uppercase">{p.name}</p>
                        {i === 0 && <p className="text-sm font-black text-[#ff4d4d] uppercase tracking-widest mt-1">Up Next</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}