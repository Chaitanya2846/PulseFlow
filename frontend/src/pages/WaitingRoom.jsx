import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Activity, Clock, ArrowRight, Users, Volume2, VolumeX } from 'lucide-react';

export default function WaitingRoom() {
  const { clinicCode } = useParams(); 
  const [queueData, setQueueData] = useState(null);
  const [error, setError] = useState('');
  
  // Audio state and tracking
  const [audioEnabled, setAudioEnabled] = useState(false);
  const prevTokenRef = useRef(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/queue/public/${clinicCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setQueueData(data);
          // Set initial token so we don't announce it immediately on load
          prevTokenRef.current = data.activeToken;
          
          if (!hasJoined.current && data.clinicId) {
            socket.emit('join_clinic_room', data.clinicId);
            hasJoined.current = true;
          }
        }
      })
      .catch(() => setError('Display connection failed'));

    socket.on('queue_updated', (newData) => {
      setQueueData(prev => ({...prev, ...newData}));
    });

    return () => socket.off('queue_updated');
  }, [clinicCode]);

  // ==========================================
  // TEXT-TO-SPEECH (TTS) ENGINE
  // ==========================================
  useEffect(() => {
    if (queueData && queueData.activeToken !== 0) {
      // If the token has changed and it's not the initial load
      if (prevTokenRef.current !== null && prevTokenRef.current !== queueData.activeToken) {
        
        if (audioEnabled && 'speechSynthesis' in window) {
          // Cancel any ongoing speech to avoid overlap
          window.speechSynthesis.cancel();
          
          const textToSpeak = `Token number A ${queueData.activeToken}. Please proceed to the doctor's cabin.`;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          
          // Optimize pacing for clarity in a waiting room
          utterance.rate = 0.85; 
          utterance.pitch = 1;
          
          window.speechSynthesis.speak(utterance);
        }
      }
      // Update the ref to the current token
      prevTokenRef.current = queueData.activeToken;
    }
  }, [queueData?.activeToken, audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    // Play a tiny silent utterance immediately on click to unlock iOS/Safari audio context
    if (!audioEnabled && 'speechSynthesis' in window) {
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
    }
  };

  if (error) return <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-red-400 text-4xl font-bold">{error}</div>;
  if (!queueData) return <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-white text-4xl font-bold animate-pulse">Loading Display...</div>;

  const nextToken = queueData.waitingList.length > 0 ? queueData.waitingList[0].tokenNumber : '--';

  return (
    // STRICT VIEWPORT LOCK: h-screen w-screen overflow-hidden prevents all scrolling
    <div className="h-screen w-screen bg-slate-50 font-sans flex flex-col overflow-hidden">
      
      {/* Header - Fixed Height */}
      <header className="h-[12vh] min-h-[80px] bg-white px-8 shadow-sm flex justify-between items-center border-b border-slate-200 shrink-0">
        <h1 className="text-4xl xl:text-5xl font-black text-slate-900 flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
            <Activity className="w-8 h-8 xl:w-10 xl:h-10 stroke-[3px]" />
          </div>
          <span className="tracking-tight uppercase">{queueData.clinicName}</span>
        </h1>
        
        <div className="flex items-center gap-6">
          {/* AUDIO TOGGLE BUTTON */}
          <button 
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm ${audioEnabled ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200 animate-pulse'}`}
          >
            {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            <span className="hidden sm:inline text-lg">{audioEnabled ? 'Voice Active' : 'Enable Voice'}</span>
          </button>

          <div className="flex items-center gap-4 bg-slate-100 px-6 py-3 rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 text-slate-500 hidden sm:block" />
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Average Pace</p>
              <p className="text-xl xl:text-2xl font-black text-slate-900">~{Math.round(queueData.averageTime)} mins / patient</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid - Fills remaining height perfectly */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-6 gap-6 min-h-0">
        
        {/* LEFT PANEL: Currently Serving */}
        <div className="lg:col-span-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2rem] shadow-xl text-white flex flex-col items-center justify-center relative overflow-hidden border-8 border-emerald-400/30">
          <Activity className="absolute -left-10 -bottom-10 w-[40vh] h-[40vh] text-white opacity-10" />
          
          <div className="relative z-10 text-center w-full">
            <h2 className="text-3xl xl:text-4xl font-bold uppercase tracking-widest text-emerald-100 mb-4 drop-shadow-md">
              Now Serving
            </h2>
            {/* Dynamic sizing based on viewport height (vh) */}
            <div className="text-[18vh] leading-none font-black tracking-tighter drop-shadow-2xl">
              {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Up Next & Waiting List */}
        <div className="lg:col-span-5 flex flex-col gap-6 min-h-0">
          
          {/* Up Next Module */}
          <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-xl flex flex-col items-center justify-center relative overflow-hidden border-8 border-blue-400/30">
            <ArrowRight className="absolute -right-10 top-10 w-[20vh] h-[20vh] text-white opacity-10" />
            
            <h2 className="text-2xl xl:text-3xl font-bold uppercase tracking-widest text-blue-200 mb-2 z-10">
              Next Token
            </h2>
            {/* Dynamic sizing based on viewport height (vh) */}
            <div className="text-[12vh] leading-none font-black text-white tracking-tighter z-10 drop-shadow-xl">
              {nextToken !== '--' ? `A-${nextToken}` : '--'}
            </div>
          </div>
          
          {/* Waiting Count Module */}
          <div className="flex-1 bg-white rounded-[2rem] shadow-lg border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-3 bg-slate-800"></div>
             
             <Users className="w-12 h-12 xl:w-16 xl:h-16 text-slate-300 mb-2" />
             <h2 className="text-2xl xl:text-3xl font-bold uppercase tracking-widest text-slate-400 mb-2">
              Waiting Queue
             </h2>
             <div className="text-[10vh] leading-none font-black text-slate-900 tracking-tighter flex items-baseline gap-3">
                {queueData.waitingList.length} 
                <span className="text-3xl xl:text-4xl font-bold text-slate-400 tracking-normal uppercase">Patients</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}