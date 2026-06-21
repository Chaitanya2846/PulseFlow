import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Receptionist from './pages/Receptionist';
import DoctorDashboard from './pages/DoctorDashboard';
import WaitingRoom from './pages/WaitingRoom';
import MobileTracking from './pages/MobileTracking';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans text-gray-900">
        <Routes>
          {/* Default routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Public Patient Routes */}
          {/* This is the new Public TV Display route */}
          <Route path="/clinic/:clinicCode/display" element={<WaitingRoom />} />
          <Route path="/track/:trackingId" element={<MobileTracking />} />

          {/* Secured Routes */}
          <Route 
            path="/receptionist" 
            element={
              <ProtectedRoute allowedRole="receptionist">
                <Receptionist />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}