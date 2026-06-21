import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { Clock, Activity, Bell, CheckCircle } from 'lucide-react';

export default function MobileTracking() {
  // We grab the trackingId (e.g., PF-8342) directly from the URL
  const { trackingId } = useParams(); 
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');
  const hasJoined = useRef(false);

  // Helper function to hit our new dedicated tracking API
  const fetchTrackingData = () => {
    fetch(`http://${window.location.hostname}:5000/api/queue/track/${trackingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setError(data.message);
        } else {
          setTrackingData(data);
          // Securely join the isolated clinic room for live socket updates
          if (!hasJoined.current && data.clinic.clinicId) {
            socket.emit('join_clinic_room', data.clinic.clinicId);
            hasJoined.current = true;
          }
        }
      })
      .catch(err => setError("Connection failed. Ensure backend is running."));
  };

  useEffect(() => {
    // 1. Initial fetch when the page loads
    fetchTrackingData();

    // 2. Whenever the clinic queue updates, re-fetch our specific patient data
    socket.on('queue_updated', fetchTrackingData);

    return () => {
      socket.off('queue_updated', fetchTrackingData);
    };
  }, [trackingId]);

  // Loading & Error States
  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-error-light)' }}
          >
            <Activity size={32} style={{ color: 'var(--color-error)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Unable to Load
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <Activity size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Loading your status...
          </p>
        </div>
      </div>
    );
  }

  // Destructure the data coming from our new backend API
  const { patient, clinic, peopleAhead } = trackingData;
  const estimatedWait = peopleAhead * clinic.averageTime;
  
  const isMyTurn = patient.status === 'serving';
  const isCompleted = patient.status === 'completed';

  // SCENARIO 1: CONSULTATION COMPLETE
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-success-light)' }}
          >
            <CheckCircle size={32} style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Complete!
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Your consultation with {clinic.name} is complete. Thank you for visiting!
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Feel free to close this page.
          </p>
        </div>
      </div>
    );
  }

  // SCENARIO 2: WAITING OR SERVING
  return (
    <div className="min-h-screen bg-surface p-4 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Activity size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            PulseFlow
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {clinic.name}
        </p>
      </div>

      {isMyTurn ? (
        // Your Turn Alert
        <div className="card p-8 text-center" style={{ backgroundColor: 'var(--color-success-light)', border: '2px solid var(--color-success)' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            <Bell size={32} className="text-white animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-success)' }}>
            It's Your Turn!
          </h2>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>
            Please proceed to the consultation room
          </p>
        </div>
      ) : (
        <>
          {/* Token Display */}
          <div className="card p-8 text-center mb-6">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Your Token
            </p>
            <div
              className="text-7xl font-bold mb-2"
              style={{ color: 'var(--color-primary)' }}
            >
              A-{patient.tokenNumber}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              ID: {patient.trackingId}
            </p>
          </div>

          {/* Queue Status Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Estimated Wait */}
            <div className="card p-4 text-center">
              <Clock size={24} className="mx-auto mb-2" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Est. Wait
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>
                ~{Math.max(Math.round(estimatedWait), 0)}m
              </p>
            </div>

            {/* People Ahead */}
            <div className="card p-4 text-center">
              <Activity size={24} className="mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Ahead of You
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {peopleAhead}
              </p>
            </div>
          </div>

          {/* Now Serving */}
          <div className="card p-6 text-center">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Now Serving
            </p>
            <p
              className="text-5xl font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              A-{clinic.activeToken === 0 ? '--' : clinic.activeToken}
            </p>
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Updates live every few seconds. Keep this page open for best experience.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
