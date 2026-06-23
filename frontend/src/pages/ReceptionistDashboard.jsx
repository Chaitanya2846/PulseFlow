import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { QRCodeSVG } from 'qrcode.react';
import { Users, UserPlus, Activity, MessageCircle, Trash2, Edit3, LogOut, Smartphone, RefreshCw, Clock, Monitor, Play, UserMinus, ShieldAlert } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [], skippedList: [], currentPatientCalledAt: null, isPaused: false, pauseReason: '' });
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Priority state for triage
  const [priority, setPriority] = useState('Normal'); 
  
  const [now, setNow] = useState(Date.now()); 
  const hasJoined = useRef(false);
  const navigate = useNavigate();

  const clinicId = localStorage.getItem('pulseflow_clinicId');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('pulseflow_token')}`
  };

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
        body: JSON.stringify({ name: patientName, mobile: mobileNumber, priority: priority })
      });
      
      const data = await response.json();

      if (response.ok && data.patient) {
        setPatientName(''); 
        setMobileNumber('');
        setPriority('Normal'); // Reset triage state
      } else {
        alert(data.message || "Error adding patient");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  // ==========================================
  // WORKFLOW CONTROLS: Call, Skip, Recall
  // ==========================================
  const handleCallNext = async () => {
    // Front-end lock just in case
    if (queueData.isPaused) return alert("Queue is paused by the Doctor. Cannot call next.");
    
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/advance`, { 
        method: 'PUT', headers: authHeaders 
      });
      const data = await response.json();
      if (!response.ok) alert(data.message);
    } catch (error) {
      console.error("Error calling next:", error);
    }
  };

  const handleSkipPatient = async () => {
    if (queueData.isPaused) return alert("Queue is paused. Cannot skip patient.");
    if (!window.confirm(`Are you sure you want to mark token A-${queueData.activeToken} as a No-Show?`)) return;

    try {
      await fetch(`http://${window.location.hostname}:5000/api/queue/skip`, { 
        method: 'PUT', headers: authHeaders 
      });
    } catch (error) {
      console.error("Error skipping patient:", error);
    }
  };

  const handleRecall = async (patientId) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/queue/recall/${patientId}`, {
        method: 'PUT',
        headers: authHeaders
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Error recalling patient:", error);
    }
  };
  // ==========================================

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
              
              {/* TRIAGE PRIORITY DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Triage Priority</label>
                <select 
                  value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-700"
                >
                  <option value="Normal">🟢 Normal (Routine)</option>
                  <option value="High">🟠 High (Urgent)</option>
                  <option value="Emergency">🔴 Emergency (Immediate)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 mt-2">
                <UserPlus className="w-5 h-5" /> Add to Queue
              </button>
            </form>

            {/* STRICT CONTROL: NOW SERVING & CALL NEXT - LOCKED IF PAUSED */}
            <div className={`rounded-2xl shadow-md p-6 text-white text-center relative overflow-hidden transition-colors duration-500 ${queueData.isPaused ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">
                {queueData.isPaused ? `PAUSED BY DOCTOR` : (queueData.activeToken !== 0 ? 'In Consultation' : 'Waiting on Reception')}
              </p>
              
              {/* Show Pause Reason if paused, else show token */}
              {queueData.isPaused ? (
                <div className="flex flex-col items-center justify-center h-24 mb-6">
                  <p className="text-xl font-bold tracking-tight text-white mb-2">Queue Frozen</p>
                  <p className="text-sm text-amber-100">{queueData.pauseReason || 'Doctor unavailable'}</p>
                </div>
              ) : (
                <p className="text-7xl font-black tracking-tighter mb-6 h-24 flex items-center justify-center">
                  {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
                </p>
              )}
              
              <div className="space-y-3">
                <button 
                  onClick={handleCallNext}
                  disabled={queueData.activeToken !== 0 || queueData.waitingList.length === 0 || queueData.isPaused}
                  className="w-full bg-white text-emerald-700 font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" /> Call Next
                </button>

                <button 
                  onClick={handleSkipPatient}
                  disabled={queueData.activeToken === 0 || queueData.isPaused}
                  className="w-full bg-black/20 hover:bg-black/30 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserMinus className="w-4 h-4" /> Skip / No-Show
                </button>
              </div>
            </div>

            {/* Set Average Time */}
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

          {/* RIGHT COLUMN: Waiting and Recall Rosters */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-[750px]">
            
            {/* Section A: Active Waiting Roster */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="border-b border-slate-100 p-5 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/> Waiting Roster</h2>
                <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full">{queueData.waitingList.length} Active</span>
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
                      // LIVE ELAPSED MATH ENGINE
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

                      const trackingUrl = `http://${window.location.host}/track/${patient.trackingId || patient.tokenNumber}`;
                      const waMessage = `Hello ${patient.name},\n\nYour token number is A-${patient.tokenNumber}.\n\nTrack your live queue status here:\n${trackingUrl}\n\n- PulseFlow Clinic`;

                      return (
                        <li key={patient._id} className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-2xl p-5 hover:shadow-md transition-all group ${patient.priority === 'Emergency' ? 'bg-red-50/30 border-red-200' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                          {/* Patient Info */}
                          <div className="flex items-center gap-5 mb-4 sm:mb-0">
                            <div className={`font-black text-2xl px-4 py-3 rounded-xl min-w-[70px] text-center shadow-inner ${patient.priority === 'Emergency' ? 'bg-red-100 text-red-700' : patient.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              A-{patient.tokenNumber}
                            </div>
                            <div>
                              <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                {patient.name}
                                <button onClick={() => handleEdit(patient)} className="text-slate-300 hover:text-indigo-600 transition-colors" title="Edit Patient Details">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* PRIORITY BADGES */}
                              <div className="flex gap-2 mt-1 items-center">
                                {patient.trackingId && <p className="text-xs font-mono text-slate-500">ID: {patient.trackingId}</p>}
                                {patient.priority === 'Emergency' && <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse border border-red-200">Emergency</span>}
                                {patient.priority === 'High' && <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-orange-200">High</span>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions & Stats */}
                          <div className="flex items-center gap-6 justify-between sm:justify-end">
                            <div className="text-right border-r border-slate-200 pr-6 hidden md:block">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Wait</p>
                              <p className="text-lg font-bold text-slate-700 flex items-center justify-end gap-1">
                                <Clock className="w-4 h-4 text-indigo-400 animate-pulse" /> ~{finalDisplayWait}m
                              </p>
                            </div>

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

            {/* Section B: REAL-TIME RECALL BOARD */}
            <div className="bg-white rounded-3xl shadow-sm border border-amber-200 overflow-hidden h-[240px] flex flex-col shrink-0">
              <div className="border-b border-amber-200 p-4 flex justify-between items-center bg-amber-50">
                <h2 className="text-md font-bold text-amber-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500"/> Absent / Recall Holding Area
                </h2>
                <span className="bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{queueData.skippedList?.length || 0} Skipped</span>
              </div>

              <div className="overflow-y-auto flex-1 p-4 bg-slate-50/50">
                {!queueData.skippedList || queueData.skippedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p className="text-sm font-medium">No skipped tokens on standby.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {queueData.skippedList.map((patient) => (
                      <div key={patient._id} className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm border-l-4 border-l-amber-500">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-sm">A-{patient.tokenNumber}</span>
                            <span className="font-bold text-slate-800 text-md truncate max-w-[150px]">{patient.name}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-amber-600/80">Eligible for priority recall</p>
                        </div>
                        <button 
                          onClick={() => handleRecall(patient._id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          Recall Next
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}