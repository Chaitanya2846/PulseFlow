import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Users, UserPlus, Activity, QrCode, MessageCircle, Trash2, Edit3 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Receptionist() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [] });
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const hasJoined = useRef(false);

  // 1. Grab credentials securely from LocalStorage
  const clinicId = localStorage.getItem('pulseflow_clinicId');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('pulseflow_token')}`
  };

  // Fetch initial state and listen for real-time socket updates
  useEffect(() => {
    // FIX: Tell the server to drop us into the correct isolated room for live updates!
    if (clinicId && !hasJoined.current) {
      socket.emit('join_clinic_room', clinicId);
      hasJoined.current = true;
    }

    // Attach clinicId to query string for initial load
    fetch(`http://${window.location.hostname}:5000/api/queue/state?clinicId=${clinicId}`)
      .then(res => res.json())
      .then(data => setQueueData(data))
      .catch(err => console.error("Error fetching state:", err));

    socket.on('queue_updated', (data) => {
      setQueueData(data);
    });

    return () => {
      socket.off('queue_updated');
    };
  }, [clinicId]);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/add`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          name: patientName, 
          mobile: mobileNumber,
          priority: 'Normal' 
        })
      });
      setPatientName('');
      setMobileNumber('');
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to cancel this token?")) return;
    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/cancel/${patientId}`, {
        method: 'DELETE', 
        headers: authHeaders
      });
    } catch (error) { 
      console.error("Error cancelling patient:", error); 
    }
  };

  const handleEdit = async (patient) => {
    const newName = window.prompt("Edit Patient Name:", patient.name);
    const newMobile = window.prompt("Edit Mobile Number:", patient.mobile || '');
    
    if (newName && newName.trim() !== "") {
      try {
        await fetch(`http://${window.location.hostname}:5000/api/queue/edit/${patient._id}`, {
          method: 'PUT', 
          headers: authHeaders,
          body: JSON.stringify({ name: newName, mobile: newMobile })
        });
      } catch (error) { 
        console.error("Error editing patient:", error); 
      }
    }
  };

  const handleResetSession = async () => {
    const confirmReset = window.confirm(
      "WARNING: Are you sure you want to start a new session? This will wipe the current waiting list and reset token numbers to 0."
    );
    
    if (!confirmReset) return;

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/reset`, { 
        method: 'POST',
        headers: authHeaders
      });
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pulseflow_token');
    localStorage.removeItem('pulseflow_role');
    localStorage.removeItem('pulseflow_clinicId');
    window.location.href = '/login';
  };

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
            <span className="font-black uppercase tracking-wider">Mobile Sync</span>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 font-black uppercase tracking-wider hover:bg-gray-800 transition-transform active:translate-y-1 active:shadow-none"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Action Center */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Add Patient Form */}
          <form onSubmit={handleAddPatient} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-2">New Entry</h2>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="PATIENT NAME" 
                className="bg-gray-100 border-4 border-black p-4 text-xl font-bold placeholder-gray-400 focus:outline-none focus:bg-[#ffffb3] transition-colors"
                required
              />
              <input 
                type="text" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="MOBILE NUMBER (OPTIONAL)" 
                className="bg-gray-100 border-4 border-black p-4 text-xl font-bold placeholder-gray-400 focus:outline-none focus:bg-[#ffffb3] transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="bg-[#3399ff] border-4 border-black text-white py-4 font-black text-xl flex justify-center items-center gap-2 hover:bg-[#1a8cff] transition-colors"
            >
              <UserPlus className="stroke-[3px]" />
              ADD PATIENT
            </button>
          </form>

          {/* Active Token Card */}
          <div className="bg-[#b3ffb3] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center flex flex-col justify-center items-center h-48 transition-transform hover:-translate-y-1">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Doctor Is Serving</h2>
            <div className="text-7xl font-black tracking-tighter">
              {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
            </div>
          </div>

          {/* Live Algorithm Data */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold text-gray-600 uppercase text-sm mb-1">Live Engine Data</p>
            <p className="text-2xl font-black">Avg Consultation: {queueData.averageTime} mins</p>
          </div>
        </div>

        {/* Right Column: Queue Management */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
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
            
            <div className="p-4 overflow-y-auto max-h-[700px]">
              {queueData.waitingList.length === 0 ? (
                <div className="text-center text-gray-500 font-bold text-2xl mt-12 uppercase">
                  Queue is empty
                </div>
              ) : (
                <ul className="space-y-4">
                  {queueData.waitingList.map((patient, index) => {
                    const trackingUrl = `http://${window.location.host}/track/${patient.trackingId || patient.tokenNumber}`;
                    const waMessage = `Hello ${patient.name},\n\nYour token number is A-${patient.tokenNumber}.\n\nTrack your live queue status here:\n${trackingUrl}\n\n- PulseFlow Clinic`;

                    return (
                      <li key={patient._id} className="flex items-center justify-between bg-gray-100 border-4 border-black p-4 group">
                        <div>
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-black min-w-[70px]">A-{patient.tokenNumber}</span>
                            <span className="text-2xl font-bold uppercase flex items-center gap-3">
                              {patient.name}
                              <button 
                                onClick={() => handleEdit(patient)} 
                                className="text-gray-400 hover:text-black transition-colors"
                                title="Edit Patient Details"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                            </span>
                          </div>
                          {patient.trackingId && (
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase">ID: {patient.trackingId}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right border-r-4 border-black pr-6">
                            <p className="font-bold text-gray-500">Wait Time</p>
                            <p className="text-xl font-black">~{Math.round((index + 1) * queueData.averageTime)} min</p>
                          </div>

                          {/* Action Buttons: WhatsApp and Delete */}
                          <div className="flex items-center gap-2">
                            {patient.mobile ? (
                              <a 
                                href={`https://wa.me/${patient.mobile}?text=${encodeURIComponent(waMessage)}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-[#25D366] border-4 border-black p-3 hover:bg-[#20b858] transition-colors group/wa"
                                title="Send WhatsApp Update"
                              >
                                <MessageCircle className="w-6 h-6 text-white group-hover/wa:scale-110 transition-transform" />
                              </a>
                            ) : (
                              <div className="bg-gray-300 border-4 border-black p-3 opacity-50 cursor-not-allowed">
                                <MessageCircle className="w-6 h-6 text-gray-500" />
                              </div>
                            )}

                            <button 
                              onClick={() => handleDelete(patient._id)} 
                              className="bg-[#ff4d4d] border-4 border-black p-3 hover:bg-[#ff3333] transition-colors group/del"
                              title="Cancel Token"
                            >
                              <Trash2 className="w-6 h-6 text-white group-hover/del:scale-110 transition-transform" />
                            </button>
                          </div>

                          {/* QR Code Generator */}
                          <div className="text-center">
                            <p className="font-bold text-xs uppercase mb-1">Scan</p>
                            <div className="bg-white p-1 border-2 border-black inline-block">
                              <QRCodeSVG 
                                value={trackingUrl} 
                                size={50} 
                              />
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}