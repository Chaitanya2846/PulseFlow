import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Receptionist from './pages/Receptionist';
import WaitingRoom from './pages/WaitingRoom';
import MobileTracking from './pages/MobileTracking';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-900">
        <Routes>
          {/* Default route instantly redirects to the Receptionist dashboard */}
          <Route path="/" element={<Navigate to="/receptionist" replace />} />
          
          {/* The two main pages we built */}
          <Route path="/receptionist" element={<Receptionist />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/track/:token" element={<MobileTracking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}