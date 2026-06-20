import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Users, ArrowRight, UserPlus, Activity, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Receptionist() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [] });
  const [patientName, setPatientName] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  // Fetch initial state and listen for real-time socket updates
  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/queue/state`)
      .then(res => res.json())
      .then(data => setQueueData(data))
      .catch(err => console.error("Error fetching state:", err));

    socket.on('queue_updated', (data) => {
      setQueueData(data);
    });

    return () => {
      socket.off('queue_updated');
    };
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: patientName, priority: 'Normal' })
      });
      setPatientName('');
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleCallNext = async () => {
    if (isCalling) return; 
    setIsCalling(true);

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/advance`, { method: 'PUT' });
      // 2-Second lock to prevent accidental double-clicks
      setTimeout(() => setIsCalling(false), 2000);
    } catch (error) {
      console.error("Error advancing queue:", error);
      setIsCalling(false);
    }
  };

  const handleResetSession = async () => {
    // Edge Case: Prevent accidental wipes
    const confirmReset = window.confirm(
      "WARNING: Are you sure you want to start a new session? This will wipe the current waiting list and reset token numbers to 0."
    );
    
    if (!confirmReset) return;

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/reset`, { method: 'POST' });
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  };

  // Helper variable to disable the "Call Next" button if clinic is empty
  const isQueueEmpty = queueData.activeToken === 0 && queueData.waitingList.length === 0;

  return (
    <div className="min-h-screen bg-[#f4f4f0] p-8 font-sans">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end border-b-4 border-black pb-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight flex items-center gap-3">
            <Activity className="w-12 h-12 stroke-[3px]" />
            PulseFlow
          </h1>
          <p className="text-xl font-bold mt-2 text-gray-700 uppercase tracking-widest">
            Reception Control Panel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleResetSession}
            className="bg-[#ffe600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 font-black uppercase tracking-wider hover:bg-[#e6cc00] transition-transform active:translate-y-1 active:shadow-none text-black"
          >
            Start New Session
          </button>
          <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <span className="font-black uppercase tracking-wider">Mobile Sync Active</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Action Center */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Active Token Card */}
          <div className="bg-[#b3ffb3] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center flex flex-col justify-center items-center h-80 transition-transform hover:-translate-y-1">
            <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">Now Serving</h2>
            <div className="text-9xl font-black tracking-tighter">
              {queueData.activeToken === 0 ? '--' : queueData.activeToken}
            </div>
          </div>

          {/* Call Next Button (Mistake-Proofed) */}
          <button 
            onClick={handleCallNext}
            disabled={isCalling || isQueueEmpty}
            className={`flex justify-center items-center gap-4 w-full py-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-4xl font-black uppercase tracking-wider transition-all
              ${(isCalling || isQueueEmpty)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none translate-y-2' 
                : 'bg-[#ff4d4d] hover:bg-[#ff3333] text-white active:translate-y-2 active:shadow-none'}`}
          >
            {isCalling ? 'Updating...' : 'Call Next'}
            {!isCalling && <ArrowRight className="w-10 h-10 stroke-[4px]" />}
          </button>

          {/* Live Algorithm Data */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold text-gray-600 uppercase text-sm mb-1">Live Engine Data</p>
            <p className="text-2xl font-black">Avg Consultation: {queueData.averageTime} mins</p>
          </div>
        </div>

        {/* Right Column: Queue Management */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Add Patient Form */}
          <form onSubmit={handleAddPatient} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex gap-4">
            <input 
              type="text" 
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="ENTER PATIENT NAME" 
              className="flex-1 bg-gray-100 border-4 border-black p-4 text-2xl font-bold placeholder-gray-400 focus:outline-none focus:bg-[#ffffb3] transition-colors"
            />
            <button 
              type="submit"
              className="bg-[#3399ff] border-4 border-black text-white px-8 py-4 font-black text-xl flex items-center gap-2 hover:bg-[#1a8cff] transition-colors"
            >
              <UserPlus className="stroke-[3px]" />
              ADD
            </button>
          </form>

          {/* Waiting List */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1 overflow-hidden flex flex-col">
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-3 uppercase">
                <Users className="stroke-[3px]" />
                Waiting Queue
              </h2>
              <span className="font-bold text-xl bg-white text-black px-3 py-1 border-2 border-black">
                {queueData.waitingList.length} Waiting
              </span>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[500px]">
              {queueData.waitingList.length === 0 ? (
                <div className="text-center text-gray-500 font-bold text-2xl mt-12 uppercase">
                  Queue is empty
                </div>
              ) : (
                <ul className="space-y-4">
                  {queueData.waitingList.map((patient, index) => (
                    <li key={patient._id} className="flex items-center justify-between bg-gray-100 border-4 border-black p-4">
                    <div className="flex items-center gap-6">
                        <span className="text-3xl font-black">#{patient.tokenNumber}</span>
                        <span className="text-2xl font-bold uppercase">{patient.name}</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right border-r-4 border-black pr-8">
                        <p className="font-bold text-gray-500">Wait Time</p>
                        <p className="text-xl font-black">~{Math.round((index + 1) * queueData.averageTime)} min</p>
                        </div>
                        {/* QR Code Generator */}
                        <div className="text-center">
                        <p className="font-bold text-xs uppercase mb-1">Mobile Sync</p>
                        <div className="bg-white p-1 border-2 border-black inline-block">
                            <QRCodeSVG 
                            value={`${window.location.origin}/track/${patient.tokenNumber}`} 
                            size={60} 
                            />
                        </div>
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
    </div>
  );
}