import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Users, UserPlus, Activity, QrCode, MessageCircle, Trash2, Edit3, LogOut, RotateCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header
        className="border-b"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                PulseFlow
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Reception Control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all text-white"
              style={{ backgroundColor: 'var(--color-warning)' }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
              title="Start new session"
            >
              <RotateCcw size={18} /> New Session
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
              style={{
                color: 'var(--color-error)',
                backgroundColor: 'var(--color-error-light)',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = 'var(--color-error)')
                && (e.target.style.color = 'white')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--color-error-light)')
                && (e.target.style.color = 'var(--color-error)')}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Add Patient + Status */}
          <div className="flex flex-col gap-6">
            {/* Add Patient Form */}
            <form onSubmit={handleAddPatient} className="card p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Add Patient
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full py-3 font-semibold flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus size={18} /> Add Patient
                </button>
              </div>
            </form>

            {/* Current Consultation Card */}
            <div className="card p-6">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Currently Serving
              </p>
              <div
                className="rounded-lg p-6 text-center"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <div
                  className="text-5xl font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="card p-6">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Clinic Metrics
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Avg Consultation
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>
                    {queueData.averageTime} min
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Patients Waiting
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {queueData.waitingList.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Queue Management - 2 column span */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden flex flex-col" style={{ height: '100%' }}>
              <div
                className="px-6 py-4 flex items-center justify-between font-semibold"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Users size={20} />
                  Waiting Queue
                </div>
                <div
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  {queueData.waitingList.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {queueData.waitingList.length === 0 ? (
                  <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-semibold">No patients waiting</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {queueData.waitingList.map((patient, index) => {
                      const trackingUrl = `http://${window.location.host}/track/${patient.trackingId || patient.tokenNumber}`;
                      const waMessage = `Hello ${patient.name},\n\nYour token number is A-${patient.tokenNumber}.\n\nTrack your live queue status here:\n${trackingUrl}\n\n- PulseFlow Clinic`;

                      return (
                        <li
                          key={patient._id}
                          className="p-4 rounded-lg"
                          style={{
                            backgroundColor: index === 0 ? 'var(--color-primary-light)' : 'var(--color-surface)',
                            border: index === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                                  A-{patient.tokenNumber}
                                </p>
                                {index === 0 && (
                                  <div
                                    className="px-2 py-1 rounded text-xs font-bold"
                                    style={{
                                      backgroundColor: 'var(--color-warning-light)',
                                      color: 'var(--color-warning)',
                                    }}
                                  >
                                    Next
                                  </div>
                                )}
                              </div>
                              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                {patient.name}
                              </p>
                              {patient.trackingId && (
                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                  ID: {patient.trackingId}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                Est. Wait
                              </p>
                              <p className="font-bold" style={{ color: 'var(--color-secondary)' }}>
                                ~{Math.round((index + 1) * queueData.averageTime)} min
                              </p>
                            </div>
                          </div>

                          {/* Actions Row */}
                          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                              {patient.mobile ? (
                                <a
                                  href={`https://wa.me/${patient.mobile}?text=${encodeURIComponent(waMessage)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-center w-8 h-8 rounded text-white transition-all hover:scale-110"
                                  style={{ backgroundColor: '#25D366' }}
                                  title="Send WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </a>
                              ) : (
                                <div
                                  className="flex items-center justify-center w-8 h-8 rounded opacity-50"
                                  style={{ backgroundColor: 'var(--color-border)' }}
                                  title="No mobile number"
                                >
                                  <MessageCircle size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                              )}
                              <button
                                onClick={() => handleEdit(patient)}
                                className="flex items-center justify-center w-8 h-8 rounded transition-all hover:scale-110"
                                style={{
                                  backgroundColor: 'var(--color-primary-light)',
                                  color: 'var(--color-primary)',
                                }}
                                title="Edit patient"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(patient._id)}
                                className="flex items-center justify-center w-8 h-8 rounded transition-all hover:scale-110 text-white"
                                style={{ backgroundColor: 'var(--color-error)' }}
                                title="Cancel token"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* QR Code */}
                            <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                              <QRCodeSVG value={trackingUrl} size={40} />
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
    </div>
  );
}
