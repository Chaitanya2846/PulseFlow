import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Clock, Activity, Bell } from 'lucide-react';

export default function MobileTracking() {
  const { token } = useParams();
  const myToken = parseInt(token, 10);
  
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [] });

  useEffect(() => {
    // 1. Fetch current state using dynamic hostname (works on Wi-Fi and localhost)
    fetch(`http://${window.location.hostname}:5000/api/queue/state`)
      .then(res => res.json())
      .then(data => setQueueData(data))
      .catch(err => console.error("Error fetching state:", err));

    // 2. Listen for live updates
    socket.on('queue_updated', (data) => setQueueData(data));
    return () => socket.off('queue_updated');
  }, []);

  // Calculate personal metrics
  const myIndex = queueData.waitingList.findIndex(p => p.tokenNumber === myToken);
  const peopleAhead = myIndex !== -1 ? myIndex : 0;
  const estimatedWait = peopleAhead * queueData.averageTime;
  
  const isMyTurn = queueData.activeToken === myToken;
  const isCompleted = myToken < queueData.activeToken;

  if (isCompleted && !isMyTurn) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <h1 className="text-4xl font-black uppercase mb-4">Turn Completed</h1>
        <p className="text-xl text-gray-400">Your consultation is over. Thank you for visiting.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0] p-6 font-sans flex flex-col max-w-md mx-auto shadow-2xl relative">
      
      {/* Header */}
      <header className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 uppercase">
          <Activity className="stroke-[3px]" /> PulseFlow
        </h1>
        <span className="bg-black text-white px-3 py-1 font-bold text-sm uppercase">Live Tracker</span>
      </header>

      {/* Main Status Card */}
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
            <div className="text-8xl font-black tracking-tighter">#{myToken}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#ff4d4d] text-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold uppercase text-sm">Est. Wait</p>
              <p className="text-3xl font-black">~{Math.round(estimatedWait)}m</p>
            </div>
            
            <div className="bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-bold uppercase text-gray-500 mb-1">Ahead of You</p>
              <p className="text-5xl font-black">{peopleAhead}</p>
            </div>
          </div>

          <div className="mt-8 bg-black text-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Now Serving</p>
            <p className="text-4xl font-black">#{queueData.activeToken === 0 ? '--' : queueData.activeToken}</p>
          </div>
        </>
      )}
    </div>
  );
}