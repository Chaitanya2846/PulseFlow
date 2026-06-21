import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { QRCodeSVG } from 'qrcode.react';
import { Users, UserPlus, Activity, QrCode, MessageCircle, Trash2, Edit3, LogOut, Smartphone, RefreshCw, Clock, Monitor } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [], currentPatientCalledAt: null });
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [now, setNow] = useState(Date.now()); // NEW: Live ticker for real-time countdown
  const hasJoined = useRef(false);
  const navigate = useNavigate();

  const clinicId = localStorage.getItem('pulseflow_clinicId');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('pulseflow_token')}`
  };

  // Live Timer: Forces a UI recalculation every 10 seconds for wait times
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

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

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/add`, {
        method: 'POST', 
        headers: authHeaders,
        body: JSON.stringify({ name: patientName, mobile: mobileNumber, priority: 'Normal' })
      });
      
      const data = await response.json();

      if (response.ok && data.patient) {
        // === THE WHATSAPP AUTO-TRIGGER ===
        if (mobileNumber.trim() !== '') {
          // Clean the number
          let cleanNumber = mobileNumber.replace(/\D/g, '');
          // Auto-format for 10 digits
          if (cleanNumber.length === 10) cleanNumber = `91${cleanNumber}`;
          
          const trackingUrl = `http://${window.location.host}/track/${data.patient.trackingId}`;
          const waMessage = `Hello ${data.patient.name},\n\nYour Token Number is *A-${data.patient.tokenNumber}*.\n\nTrack your live queue status and estimated wait time here:\n${trackingUrl}\n\n- PulseFlow`;

          // Pop open WhatsApp Web automatically
          window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');
        }

        setPatientName(''); 
        setMobileNumber('');
      } else {
        alert(data.message || "Error adding patient");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to cancel this token?")) return;
    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/cancel/${patientId}`, { method: 'DELETE', headers: authHeaders });
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  const handleEdit = async (patient) => {
    const newName = window.prompt("Edit Patient Name:", patient.name);
    const newMobile = window.prompt("Edit Mobile Number:", patient.mobile || '');
    if (newName && newName.trim() !== "") {
      try {
        await fetch(`http://${window.location.hostname}:5000/api/queue/edit/${patient._id}`, {
          method: 'PUT', headers: authHeaders, body: JSON.stringify({ name: newName, mobile: newMobile })
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
        method: 'POST', headers: authHeaders
      });
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  };

  const handleUpdateAvgTime = async () => {
    const newTime = window.prompt("Set new average consultation time (in minutes):", Math.round(queueData.averageTime));
    if (newTime && !isNaN(newTime) && Number(newTime) > 0) {
      try {
        await fetch(`http://${window.location.hostname}:5000/api/queue/settings/time`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ newAverageTime: newTime })
        });
      } catch (error) {
        console.error("Error updating time:", error);
      }
    } else if (newTime) {
      alert("Please enter a valid number greater than 0.");
    }
  };

  const handleLaunchTV = () => {
    if (queueData.clinicCode) {
      window.open(`/display/${queueData.clinicCode}`, '_blank');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/receptionist/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="p-2 bg-indigo-50 rounded-lg"><Activity className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Front Desk</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLaunchTV} 
            className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium transition-colors px-4 py-2 rounded-lg"
          >
            <Monitor className="w-4 h-4" /> Open TV Display
          </button>  
          <button 
            onClick={handleResetSession} 
            className="flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-medium transition-colors px-4 py-2 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" /> New Session
          </button>
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
            <Smartphone className="w-4 h-4 text-emerald-500" /> Mobile Sync Active
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Actions & Stats */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Add Patient Form */}
            <form onSubmit={handleAddPatient} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2">New Patient Entry</h2>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Name</label>
                <input 
                  type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile (Optional)</label>
                <input 
                  type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="+1..."
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 mt-2">
                <UserPlus className="w-5 h-5" /> Add to Queue
              </button>
            </form>

            {/* Now Serving Card */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-md p-8 text-white text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-emerald-50 text-sm font-bold uppercase tracking-widest mb-2">Doctor Is Serving</p>
                <p className="text-7xl font-black tracking-tighter">{queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}</p>
              </div>
            </div>

            {/* HACKATHON REQUIREMENT: Set Average Time */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between group">
              <div>
                <p className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-1">Queue Pace</p>
                <p className="text-xl font-bold text-slate-800">Avg Consult Time</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 font-black text-2xl px-4 py-2 rounded-xl">
                  {Math.round(queueData.averageTime)} <span className="text-sm font-semibold">min</span>
                </div>
                <button 
                  onClick={handleUpdateAvgTime}
                  className="bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors"
                  title="Override Average Time"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Queue Table */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/> Waiting Roster</h2>
              <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full">{queueData.waitingList.length} Waiting</span>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {queueData.waitingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Users className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Queue is currently empty</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {queueData.waitingList.map((patient, index) => {
                    
                    // ========================================================
                    // LIVE ELAPSED MATH ENGINE
                    // ========================================================
                    let estimatedWait = 0;
                    if (queueData.activeToken === 0) {
                      estimatedWait = index * queueData.averageTime;
                    } else if (queueData.currentPatientCalledAt) {
                      const elapsedMs = now - new Date(queueData.currentPatientCalledAt).getTime();
                      const remainingCurrent = Math.max(queueData.averageTime - (elapsedMs / 60000), 1);
                      estimatedWait = remainingCurrent + (index * queueData.averageTime);
                    } else {
                      estimatedWait = (index + 1) * queueData.averageTime;
                    }
                    const finalDisplayWait = Math.ceil(Math.max(estimatedWait, 0));
                    // ========================================================

                    const trackingUrl = `http://${window.location.host}/track/${patient.trackingId || patient.tokenNumber}`;
                    const waMessage = `Hello ${patient.name},\n\nYour token number is A-${patient.tokenNumber}.\n\nTrack your live queue status here:\n${trackingUrl}\n\n- PulseFlow Clinic`;

                    return (
                      <li key={patient._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all group">
                        
                        {/* Patient Info */}
                        <div className="flex items-center gap-5 mb-4 sm:mb-0">
                          <div className="bg-indigo-100 text-indigo-700 font-black text-2xl px-4 py-3 rounded-xl min-w-[70px] text-center shadow-inner">
                            A-{patient.tokenNumber}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                              {patient.name}
                              <button onClick={() => handleEdit(patient)} className="text-slate-300 hover:text-indigo-600 transition-colors" title="Edit Patient Details">
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                            {patient.trackingId && <p className="text-xs font-mono text-slate-500 mt-1">ID: {patient.trackingId}</p>}
                          </div>
                        </div>
                        
                        {/* Actions & Stats */}
                        <div className="flex items-center gap-6 justify-between sm:justify-end">
                          
                          {/* Live Wait Time */}
                          <div className="text-right border-r border-slate-200 pr-6 hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Wait</p>
                            <p className="text-lg font-bold text-slate-700 flex items-center justify-end gap-1">
                              <Clock className="w-4 h-4 text-indigo-400 animate-pulse" /> ~{finalDisplayWait}m
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {patient.mobile ? (
                              <a href={`https://wa.me/${patient.mobile}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer" className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-2.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all" title="Send WhatsApp">
                                <MessageCircle className="w-5 h-5" />
                              </a>
                            ) : (
                              <div className="bg-slate-100 text-slate-300 border border-slate-200 p-2.5 rounded-lg cursor-not-allowed">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                            )}
                            <button onClick={() => handleDelete(patient._id)} className="bg-red-50 text-red-600 border border-red-200 p-2.5 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Cancel Token">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Explicit QR Code */}
                          <div className="text-center ml-2 hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scan to Track</p>
                            <div className="bg-white p-1.5 border border-slate-200 rounded-lg shadow-sm">
                              <QRCodeSVG value={trackingUrl} size={45} />
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