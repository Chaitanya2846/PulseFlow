import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Clock, Activity, Bell } from 'lucide-react';

export default function MobileTracking() {
  // We grab the trackingId (e.g., PF-8342) directly from the URL
  const { trackingId } = useParams(); 
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');
  const hasJoined = useRef(false);

  // Helper function to hit our new dedicated tracking API
  const fetchTrackingData = () => {
    fetch(`http://${window.location.hostname}:5000/api/queue/track/${trackingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setTrackingData(data);
          // Securely join the isolated clinic room for live socket updates
          if (!hasJoined.current && data.clinic.clinicId) {
            socket.emit('join_clinic_room', data.clinic.clinicId);
            hasJoined.current = true;
          }
        }
      })
      .catch(err => setError("Connection failed. Ensure backend is running."));
  };

  useEffect(() => {
    // 1. Initial fetch when the page loads
    fetchTrackingData();

    // 2. Whenever the clinic queue updates, re-fetch our specific patient data
    socket.on('queue_updated', fetchTrackingData);

    return () => {
      socket.off('queue_updated', fetchTrackingData);
    };
  }, [trackingId]);

  // Loading & Error States
  if (error) return <div className="p-10 font-black text-center text-red-500 uppercase text-2xl mt-20">{error}</div>;
  if (!trackingData) return <div className="p-10 font-black text-center animate-pulse uppercase text-2xl mt-20">Loading Status...</div>;

  // Destructure the data coming from our new backend API
  const { patient, clinic, peopleAhead } = trackingData;
  const estimatedWait = peopleAhead * clinic.averageTime;
  
  const isMyTurn = patient.status === 'serving';
  const isCompleted = patient.status === 'completed';

  // SCENARIO 1: CONSULTATION COMPLETE
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <h1 className="text-4xl font-black uppercase mb-4">Turn Completed</h1>
        <p className="text-xl text-gray-400 font-bold">Your consultation is over. Thank you for visiting {clinic.name}.</p>
      </div>
    );
  }

  // SCENARIO 2: WAITING OR SERVING
  return (
    <div className="min-h-screen bg-[#f4f4f0] p-6 font-sans flex flex-col max-w-md mx-auto shadow-2xl relative">
      <header className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 uppercase">
          <Activity className="stroke-[3px]" /> PulseFlow
        </h1>
        <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase">Live Tracker</span>
      </header>

      {isMyTurn ? (
        <div className="bg-[#b3ffb3] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center animate-pulse">
          <Bell className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-black uppercase tracking-widest mb-2">It's Your Turn!</h2>
          <p className="text-xl font-bold uppercase border-t-4 border-black pt-4 mt-4">Please proceed to the doctor</p>
        </div>
      ) : (
        <>
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center mb-8">
            <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">Your Token</p>
            <div className="text-8xl font-black tracking-tighter">A-{patient.tokenNumber}</div>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase">ID: {patient.trackingId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#ff4d4d] text-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold uppercase text-sm">Est. Wait</p>
              <p className="text-3xl font-black">~{Math.max(Math.round(estimatedWait), 0)}m</p>
            </div>
            
            <div className="bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-bold uppercase text-gray-500 mb-1">Ahead of You</p>
              <p className="text-5xl font-black">{peopleAhead}</p>
            </div>
          </div>

          <div className="mt-8 bg-black text-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Now Serving</p>
            <p className="text-4xl font-black">A-{clinic.activeToken === 0 ? '--' : clinic.activeToken}</p>
          </div>
        </>
      )}
    </div>
  );
}