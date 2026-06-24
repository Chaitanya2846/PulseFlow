import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { QRCodeSVG } from 'qrcode.react';
import { Users, UserPlus, Activity, MessageCircle, Trash2, Edit3, LogOut, Smartphone, RefreshCw, Clock, Monitor, Play, UserMinus, ShieldAlert, Bell, X, ChevronDown, CheckCircle2, User, Phone, Zap } from 'lucide-react';

export default function ReceptionistDashboard() {
  const [queueData, setQueueData] = useState({ activeToken: 0, averageTime: 10, waitingList: [], skippedList: [], currentPatientCalledAt: null, isPaused: false, pauseReason: '' });
  
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [priority, setPriority] = useState('Normal'); 
  
  // ==========================================
  // NOTIFICATION CENTER STATE
  // ==========================================
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  
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

    // LIVE SMS LISTENER
    socket.on('notification_received', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev].slice(0, 50)); 
      setUnreadCount(prev => prev + 1); 
    });

    return () => {
      socket.off('queue_updated');
      socket.off('notification_received');
    };
  }, [clinicId]);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    if (mobileNumber.length !== 10) {
      alert("Please enter exactly 10 digits for the mobile number.");
      return;
    }
    
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
        setPriority('Normal');
      } else {
        alert(data.message || "Error adding patient");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleCallNext = async () => {
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

  const toggleNotifDrawer = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) setUnreadCount(0); 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-12 overflow-x-hidden relative">
      
      {/* Decorative Background Blobs for Dashboard */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ========================================== */}
      {/* NOTIFICATION DRAWER */}
      {/* ========================================== */}
      {isNotifOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsNotifOpen(false)} 
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/90 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-white/50 ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><Bell className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Notification Logs</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mock SMS Gateway</p>
            </div>
          </div>
          <button onClick={() => setIsNotifOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-200 shadow-sm transition-colors hover:scale-105 active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
              <Smartphone className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold text-sm text-slate-500">System idle.</p>
              <p className="text-xs text-slate-400 mt-1">Dispatched SMS alerts will securely stream here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-200">
                  <div 
                    onClick={() => setExpandedNotifId(expandedNotifId === notif.id ? null : notif.id)}
                    className="p-4 cursor-pointer flex justify-between items-start"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 font-black text-xs mt-0.5">
                        {notif.token}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {notif.type}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Sent to {notif.patientName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transform transition-transform ${expandedNotifId === notif.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {expandedNotifId === notif.id && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message Payload Generated</p>
                      <div className="bg-slate-800 text-slate-300 font-mono text-[11px] p-3 rounded-xl leading-relaxed whitespace-pre-wrap shadow-inner border border-slate-700">
                        {notif.message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* GLASSMORPHIC NAVBAR */}
      {/* ========================================== */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100/50 shadow-sm"><Activity className="w-5 h-5 stroke-[3px]" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Front Desk</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Queue Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLaunchTV} 
            className="hidden lg:flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-bold transition-colors px-4 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 active:scale-95"
          >
            <Monitor className="w-4 h-4" /> Open TV Display
          </button>  
          <button 
            onClick={handleResetSession} 
            className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-bold transition-colors px-4 py-2.5 rounded-xl shadow-sm hover:-translate-y-0.5 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> New Session
          </button>
          
          <button 
            onClick={toggleNotifDrawer} 
            className="relative p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 ml-2"
            title="View SMS Logs"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white animate-bounce shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-2"></div>

          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors px-4 py-2.5 rounded-xl hover:bg-red-50 active:scale-95">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ========================================== */}
      {/* MAIN DASHBOARD CONTENT */}
      {/* ========================================== */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Actions & Stats */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* PREMIUM ADD PATIENT FORM */}
            <form onSubmit={handleAddPatient} className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-slate-200/60 p-6 sm:p-8 flex flex-col gap-5">
              <h2 className="text-lg font-black text-slate-800 mb-1 tracking-tight">New Patient Entry</h2>
              
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-600 transition-colors">Patient Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10"><User className="w-4 h-4" /></div>
                  <input 
                    type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-600 transition-colors">Mobile (10 Digits)</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10"><Phone className="w-4 h-4" /></div>
                  <input 
                    type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))} required pattern="[0-9]{10}" maxLength="10"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium text-sm" 
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-600 transition-colors">Triage Priority</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 p-1.5 bg-slate-100 rounded-md text-slate-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors z-10"><Zap className="w-4 h-4" /></div>
                  <select 
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm appearance-none"
                  >
                    <option value="Normal">🟢 Normal (Routine)</option>
                    <option value="High">🟠 High (Urgent)</option>
                    <option value="Emergency">🔴 Emergency (Immediate)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 transition-all duration-300 flex justify-center items-center gap-2 mt-2 hover:-translate-y-0.5 active:scale-[0.98] text-sm">
                <UserPlus className="w-4 h-4" /> Add to Queue
              </button>
            </form>

            {/* PREMIUM CONTROL BOX */}
            <div className={`rounded-[2rem] shadow-xl p-8 text-white text-center relative overflow-hidden transition-colors duration-500 border border-white/10 ${queueData.isPaused ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-600/20' : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-600/20'}`}>
              <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 pointer-events-none" />
              
              <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">
                {queueData.isPaused ? `PAUSED BY DOCTOR` : (queueData.activeToken !== 0 ? 'In Consultation' : 'Waiting on Reception')}
              </p>
              
              {queueData.isPaused ? (
                <div className="flex flex-col items-center justify-center h-24 mb-6 relative z-10">
                  <p className="text-2xl font-black tracking-tight text-white mb-2">Queue Frozen</p>
                  <p className="text-sm font-medium text-amber-100">{queueData.pauseReason || 'Doctor unavailable'}</p>
                </div>
              ) : (
                <p className="text-7xl font-black tracking-tighter mb-8 mt-2 h-20 flex items-center justify-center relative z-10 drop-shadow-md">
                  {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
                </p>
              )}
              
              <div className="space-y-3 relative z-10">
                <button 
                  onClick={handleCallNext}
                  disabled={queueData.activeToken !== 0 || queueData.waitingList.length === 0 || queueData.isPaused}
                  className="w-full bg-white text-emerald-700 font-black py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Play className="w-5 h-5 fill-current" /> Call Next Target
                </button>

                <button 
                  onClick={handleSkipPatient}
                  disabled={queueData.activeToken === 0 || queueData.isPaused}
                  className="w-full bg-black/20 hover:bg-black/30 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  <UserMinus className="w-4 h-4" /> Mark as No-Show
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-slate-200/60 p-6 flex items-center justify-between group">
              <div>
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">Queue Pace</p>
                <p className="text-lg font-black text-slate-800 tracking-tight">Avg Consult Time</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-2xl px-4 py-2 rounded-xl shadow-inner">
                  {Math.round(queueData.averageTime)} <span className="text-xs font-bold uppercase tracking-wider ml-0.5">min</span>
                </div>
                <button 
                  onClick={handleUpdateAvgTime}
                  className="bg-white border border-slate-200 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                  title="Override Average Time"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Rosters */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-[780px]">
            
            {/* Section A: Active Waiting Roster */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-white/50">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight"><Users className="w-5 h-5 text-indigo-500"/> Active Roster</h2>
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">{queueData.waitingList.length} Waiting</span>
              </div>

              <div className="overflow-y-auto flex-1 p-6 bg-slate-50/30">
                {queueData.waitingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="p-4 bg-slate-100 rounded-full mb-4"><Users className="w-8 h-8 opacity-40" /></div>
                    <p className="text-sm font-bold text-slate-500">Queue is currently empty</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {queueData.waitingList.map((patient, index) => {
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
                        <li key={patient._id} className={`flex flex-col sm:flex-row sm:items-center justify-between bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${patient.priority === 'Emergency' ? 'border-red-200/80 bg-red-50/10' : 'border-slate-200/80 hover:border-indigo-200/50'}`}>
                          <div className="flex items-center gap-5 mb-4 sm:mb-0">
                            <div className={`font-black text-2xl px-4 py-3 rounded-xl min-w-[70px] text-center shadow-inner border ${patient.priority === 'Emergency' ? 'bg-red-50 text-red-600 border-red-100' : patient.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                              A-{patient.tokenNumber}
                            </div>
                            <div>
                              <div className="font-black text-lg text-slate-800 flex items-center gap-2 tracking-tight">
                                {patient.name}
                                <button onClick={() => handleEdit(patient)} className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Patient">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              
                              <div className="flex gap-2 mt-1 items-center">
                                {patient.trackingId && <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ID: {patient.trackingId}</p>}
                                {patient.priority === 'Emergency' && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm shadow-red-500/30 animate-pulse">Emergency</span>}
                                {patient.priority === 'High' && <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm shadow-orange-500/30">High Priority</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 justify-between sm:justify-end">
                            <div className="text-right border-r border-slate-200 pr-6 hidden md:block">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Wait</p>
                              <p className="text-lg font-black text-slate-700 flex items-center justify-end gap-1 tracking-tight">
                                <Clock className="w-4 h-4 text-indigo-500" /> ~{finalDisplayWait}m
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {patient.mobile ? (
                                <a href={`https://wa.me/${patient.mobile}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer" className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors shadow-sm active:scale-95" title="Send WhatsApp">
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              ) : (
                                <div className="bg-slate-50 text-slate-300 border border-slate-200 p-2.5 rounded-xl cursor-not-allowed">
                                  <MessageCircle className="w-4 h-4" />
                                </div>
                              )}
                              <button onClick={() => handleDelete(patient._id)} className="bg-white text-red-500 border border-slate-200 p-2.5 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm active:scale-95" title="Cancel Token">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-center ml-2 hidden sm:block">
                              <div className="bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
                                <QRCodeSVG value={trackingUrl} size={40} />
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
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] shadow-sm border border-amber-200/60 overflow-hidden h-[220px] flex flex-col shrink-0 relative">
              <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="border-b border-amber-200/60 p-4 px-6 flex justify-between items-center bg-white/40 backdrop-blur-sm relative z-10">
                <h2 className="text-sm font-black text-amber-900 flex items-center gap-2 tracking-tight">
                  <ShieldAlert className="w-4 h-4 text-amber-500"/> Absent Holding Area
                </h2>
                <span className="bg-white border border-amber-200 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">{queueData.skippedList?.length || 0} Standby</span>
              </div>

              <div className="overflow-y-auto flex-1 p-5 relative z-10">
                {!queueData.skippedList || queueData.skippedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-amber-600/50">
                    <p className="text-xs font-bold uppercase tracking-widest">Area Clear</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {queueData.skippedList.map((patient) => (
                      <div key={patient._id} className="bg-white/80 backdrop-blur-md border border-amber-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 text-xs">A-{patient.tokenNumber}</span>
                            <span className="font-black text-slate-800 text-sm truncate max-w-[150px] tracking-tight">{patient.name}</span>
                          </div>
                          <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-widest">Priority Recall Ready</p>
                        </div>
                        <button 
                          onClick={() => handleRecall(patient._id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <RefreshCw className="w-3 h-3" /> Recall
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