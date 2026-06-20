import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Volume2, VolumeX, Clock, ArrowRight } from 'lucide-react';

export default function WaitingRoom() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [] });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevTokenRef = useRef(0);

  // 1. Fetch Initial State & Listen for Socket Events
  useEffect(() => {
    fetch('http://localhost:5000/api/queue/state')
      .then(res => res.json())
      .then(data => {
        setQueueData(data);
        prevTokenRef.current = data.activeToken;
      });

    socket.on('queue_updated', (data) => {
      setQueueData(data);
    });

    return () => socket.off('queue_updated');
  }, []);

  // 2. The WOW Feature: Voice Announcements
  useEffect(() => {
    if (audioEnabled && queueData.activeToken !== 0 && queueData.activeToken !== prevTokenRef.current) {
      const announcement = new SpeechSynthesisUtterance(`Token number ${queueData.activeToken}, please proceed to the consultation room.`);
      announcement.rate = 0.9; // Slightly slower for clarity
      announcement.pitch = 1;
      window.speechSynthesis.speak(announcement);
      prevTokenRef.current = queueData.activeToken;
    }
  }, [queueData.activeToken, audioEnabled]);

  // Audio unlock screen for browser policy
  if (!audioEnabled) {
    return (
      <div className="min-h-screen bg-[#f4f4f0] flex flex-col items-center justify-center p-8">
        <div className="bg-white border-4 border-black p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl">
          <h1 className="text-5xl font-black mb-6 uppercase">TV Display Offline</h1>
          <p className="text-xl font-bold text-gray-600 mb-8">
            Browsers require user interaction before playing audio. Click below to initialize the TV display and enable voice announcements.
          </p>
          <button 
            onClick={() => setAudioEnabled(true)}
            className="bg-[#3399ff] border-4 border-black text-white px-12 py-6 text-3xl font-black uppercase tracking-wider hover:bg-[#1a8cff] transition-colors w-full"
          >
            Start Display
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans flex flex-col">
      
      {/* Header */}
      <header className="flex justify-between items-center border-b-4 border-white pb-4 mb-6">
        <h1 className="text-4xl font-black tracking-widest uppercase">PulseFlow Display</h1>
        <div className="flex items-center gap-4 bg-white text-black px-4 py-2 border-2 border-white font-bold">
          <Volume2 className="w-6 h-6" />
          Audio Active
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Massive Active Token */}
        <div className="lg:col-span-7 bg-[#b3ffb3] text-black border-4 border-white p-12 flex flex-col justify-center items-center text-center">
          <h2 className="text-5xl font-black uppercase tracking-widest mb-8">Now Serving</h2>
          <div className="text-[15rem] leading-none font-black tracking-tighter">
            {queueData.activeToken === 0 ? '--' : queueData.activeToken}
          </div>
          <p className="mt-8 text-3xl font-bold uppercase border-t-4 border-black pt-8 w-full">
            Please proceed to doctor
          </p>
        </div>

        {/* Right Side: Up Next & Wait Times */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-[#ff4d4d] border-4 border-white p-6">
            <h2 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3">
              <Clock className="stroke-[3px]" />
              Estimated Wait
            </h2>
            <p className="text-lg font-bold mt-2 uppercase">Based on live consultation averages</p>
          </div>

          <div className="flex-1 bg-[#f4f4f0] text-black border-4 border-white p-6 overflow-hidden flex flex-col">
            <h3 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-4">Up Next</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {queueData.waitingList.length === 0 ? (
                <div className="text-3xl font-bold text-gray-500 text-center mt-12 uppercase">
                  No Patients Waiting
                </div>
              ) : (
                queueData.waitingList.slice(0, 5).map((patient, index) => (
                  <div key={patient._id} className="flex justify-between items-center bg-white border-4 border-black p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl font-black">#{patient.tokenNumber}</span>
                      <span className="text-2xl font-bold uppercase truncate max-w-[150px]">{patient.name}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="bg-black text-white px-3 py-1 font-bold text-lg uppercase mb-1">
                        Wait Time
                      </span>
                      <span className="text-3xl font-black">
                        ~{Math.round((index + 1) * queueData.averageTime)}m
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {queueData.waitingList.length > 5 && (
              <div className="mt-4 pt-4 border-t-4 border-black text-center font-bold text-xl uppercase text-gray-600">
                + {queueData.waitingList.length - 5} more waiting
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}