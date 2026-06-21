import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Activity } from 'lucide-react';

export default function WaitingRoom() {
  const { clinicCode } = useParams(); // Grabs SC-7X4K92 from the URL
  const [queueData, setQueueData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/queue/public/${clinicCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setQueueData(data);
          // Join the isolated room to receive live TV updates
          socket.emit('join_clinic_room', data.clinicId);
        }
      })
      .catch(err => setError('Connection failed'));

    socket.on('queue_updated', (data) => setQueueData(prev => ({...prev, ...data})));
    return () => socket.off('queue_updated');
  }, [clinicCode]);

  if (error) return <div className="text-4xl font-black text-center mt-20 text-red-500">{error}</div>;
  if (!queueData) return <div className="text-4xl font-black text-center mt-20">Loading Display...</div>;

  const nextToken = queueData.waitingList.length > 0 ? queueData.waitingList[0].tokenNumber : '--';

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans flex flex-col">
      <header className="flex justify-between items-center border-b-4 border-white pb-6 mb-12">
        <h1 className="text-6xl font-black flex items-center gap-4">
          <Activity className="w-16 h-16 stroke-[4px] text-[#ffe600]" />
          {queueData.clinicName}
        </h1>
        <div className="text-3xl font-bold bg-white text-black px-6 py-3">
          Est. Wait: {queueData.averageTime} min/patient
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-12">
        {/* LEFT: Current Token */}
        <div className="bg-[#b3ffb3] border-8 border-white p-12 flex flex-col items-center justify-center text-black">
          <h2 className="text-5xl font-black uppercase tracking-widest mb-8">Now Serving</h2>
          <div className="text-[15rem] leading-none font-black tracking-tighter">
            {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
          </div>
        </div>

        {/* RIGHT: Up Next & Waiting */}
        <div className="flex flex-col gap-12">
          <div className="bg-[#3399ff] border-8 border-white p-12 flex flex-col items-center justify-center text-black">
            <h2 className="text-4xl font-black uppercase tracking-widest mb-4">Up Next</h2>
            <div className="text-8xl font-black tracking-tighter">
              {nextToken !== '--' ? `A-${nextToken}` : '--'}
            </div>
          </div>
          
          <div className="border-8 border-white p-8 flex-1">
            <h3 className="text-3xl font-black uppercase border-b-4 border-white pb-4 mb-6">Waiting List</h3>
            <ul className="grid grid-cols-2 gap-6 text-4xl font-bold">
              {queueData.waitingList.slice(1, 7).map((patient) => (
                <li key={patient._id}>A-{patient.tokenNumber}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}