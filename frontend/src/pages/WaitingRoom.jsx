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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-3" style={{ color: 'var(--color-error)' }}>
            Display Error
          </h1>
          <p className="text-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Activity size={64} className="mx-auto mb-4 animate-pulse" style={{ color: 'var(--color-primary)' }} />
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            Loading Queue Display...
          </p>
        </div>
      </div>
    );
  }

  const nextToken = queueData.waitingList.length > 0 ? queueData.waitingList[0].tokenNumber : '--';
  const upcomingTokens = queueData.waitingList.slice(1, 6);

  return (
    <div className="min-h-screen bg-background p-6 font-sans flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <header className="mb-8" style={{ borderBottom: '3px solid var(--color-primary)' }}>
        <div className="flex items-center gap-4 pb-6">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Activity size={40} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
              {queueData.clinicName}
            </h1>
            <p className="text-xl font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Queue Management System
            </p>
          </div>
          <div
            className="px-6 py-4 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--color-secondary-light)',
              color: 'var(--color-secondary)',
            }}
          >
            <p className="text-sm font-semibold">Avg Wait</p>
            <p className="text-3xl font-bold">{queueData.averageTime} min</p>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-3 gap-8">
        {/* Left: Now Serving - Large Display */}
        <div
          className="col-span-1 rounded-xl p-8 text-center flex flex-col items-center justify-center"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '4px solid var(--color-primary)',
          }}
        >
          <p className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
            NOW SERVING
          </p>
          <div
            className="text-9xl font-black leading-none mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            {queueData.activeToken === 0 ? '--' : `A-${queueData.activeToken}`}
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Consultation in progress
          </p>
        </div>

        {/* Middle: Up Next */}
        <div
          className="col-span-1 rounded-xl p-8 text-center flex flex-col items-center justify-center"
          style={{
            backgroundColor: 'var(--color-secondary-light)',
            border: '4px solid var(--color-secondary)',
          }}
        >
          <p className="text-2xl font-bold mb-4" style={{ color: 'var(--color-secondary)' }}>
            UP NEXT
          </p>
          <div
            className="text-9xl font-black leading-none mb-4"
            style={{ color: 'var(--color-secondary)' }}
          >
            {nextToken !== '--' ? `A-${nextToken}` : '--'}
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Please prepare for consultation
          </p>
        </div>

        {/* Right: Waiting List */}
        <div
          className="col-span-1 rounded-xl p-8"
          style={{
            backgroundColor: 'var(--color-background)',
            border: '4px solid var(--color-border)',
          }}
        >
          <p className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
            WAITING QUEUE
          </p>
          <div className="space-y-2">
            {upcomingTokens.length === 0 ? (
              <p className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                No patients waiting
              </p>
            ) : (
              upcomingTokens.map((patient, index) => (
                <div
                  key={patient._id}
                  className="p-4 rounded-lg text-center"
                  style={{
                    backgroundColor: index === 0 ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    border: index === 0 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <p className="text-4xl font-black" style={{ color: 'var(--color-primary)' }}>
                    A-{patient.tokenNumber}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Display updates automatically. Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
